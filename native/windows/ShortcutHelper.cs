using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Windows.Automation;

namespace ShortcutHelper;

/// <summary>
/// Standalone Windows helper invoked by the Electron main process over stdio.
/// Each subcommand prints a single JSON document to stdout. Mirrors the macOS
/// Swift helper: apps, frontmost, activate &lt;pid&gt;, menu &lt;pid&gt;, permission.
///
/// Live menu accelerators are read through UI Automation
/// (<c>AcceleratorKeyProperty</c>) for the given process' top-level window.
/// </summary>
internal static class Program
{
    private const int SW_RESTORE = 9;
    private const int MaxMenuItems = 2000;

    // Best-effort menu expansion (Pass 2 of ReadMenu) opens each top-level menu
    // in turn; cap the total time so a slow or unresponsive app cannot hang the
    // reader. Pass 1's statically-readable accelerators are already collected.
    private static readonly TimeSpan MenuBudget = TimeSpan.FromSeconds(6);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    private static int Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;
        var command = args.Length > 0 ? args[0] : string.Empty;

        try
        {
            switch (command)
            {
                case "apps":
                    Emit(ListApps());
                    break;
                case "frontmost":
                    Emit(Frontmost());
                    break;
                case "activate":
                    Activate(ParsePid(args));
                    Emit(new { ok = true });
                    break;
                case "menu":
                    Emit(ReadMenu(ParsePid(args)));
                    break;
                case "permission":
                    Emit(new { trusted = true });
                    break;
                default:
                    Emit(new { error = "unknown command" });
                    return 2;
            }

            return 0;
        }
        catch (Exception ex)
        {
            Emit(new { error = ex.Message });
            return 1;
        }
    }

    private static int ParsePid(string[] args)
        => args.Length > 1 && int.TryParse(args[1], out var pid) ? pid : 0;

    /// <summary>
    /// Resolves a stable, human-friendly app name (e.g. "Notepad") from the
    /// executable's version info, falling back to the process name. Preferred
    /// over the window title, which changes with the open document and does not
    /// match curated app identities. Mirrors the macOS helper's app name.
    /// </summary>
    private static string FriendlyName(Process process)
    {
        try
        {
            var description = process.MainModule?.FileVersionInfo.FileDescription;
            if (!string.IsNullOrWhiteSpace(description))
            {
                return description!.Trim();
            }
        }
        catch
        {
            // MainModule is inaccessible for elevated / other-user processes.
        }

        return process.ProcessName;
    }

    private static void Emit(object value)
        => Console.WriteLine(JsonSerializer.Serialize(value));

    private static List<object> ListApps()
    {
        var apps = new List<object>();
        foreach (var process in Process.GetProcesses())
        {
            try
            {
                if (process.MainWindowHandle == IntPtr.Zero)
                {
                    continue;
                }

                var title = process.MainWindowTitle;
                if (string.IsNullOrWhiteSpace(title))
                {
                    continue;
                }

                apps.Add(new { id = process.ProcessName, name = FriendlyName(process), pid = process.Id });
            }
            catch
            {
                // Access to some processes is denied; skip them.
            }
        }

        return apps;
    }

    private static object? Frontmost()
    {
        var handle = GetForegroundWindow();
        if (handle == IntPtr.Zero)
        {
            return null;
        }

        GetWindowThreadProcessId(handle, out var pid);
        if (pid == 0)
        {
            return null;
        }

        try
        {
            var process = Process.GetProcessById((int)pid);
            return new
            {
                id = process.ProcessName,
                name = FriendlyName(process),
                pid = (int)pid
            };
        }
        catch
        {
            return new { id = string.Empty, name = string.Empty, pid = (int)pid };
        }
    }

    private static void Activate(int pid)
    {
        if (pid <= 0)
        {
            return;
        }

        var process = Process.GetProcessById(pid);
        var handle = process.MainWindowHandle;
        if (handle != IntPtr.Zero)
        {
            ShowWindow(handle, SW_RESTORE);
            SetForegroundWindow(handle);
        }
    }

    private static List<object> ReadMenu(int pid)
    {
        var result = new List<object>();
        if (pid <= 0)
        {
            return result;
        }

        var window = AutomationElement.RootElement.FindFirst(
            TreeScope.Children,
            new PropertyCondition(AutomationElement.ProcessIdProperty, pid));
        if (window is null)
        {
            return result;
        }

        var seen = new HashSet<string>();
        var stopwatch = Stopwatch.StartNew();
        var menuItemCondition = new PropertyCondition(
            AutomationElement.ControlTypeProperty, ControlType.MenuItem);

        // Whether there is still room and time to keep reading.
        bool WithinBudget() => result.Count < MaxMenuItems && stopwatch.Elapsed <= MenuBudget;

        void Add(string? title, string? accelerator)
        {
            if (string.IsNullOrWhiteSpace(accelerator))
            {
                return;
            }

            var label = title ?? string.Empty;
            if (seen.Add(label + "\u0000" + accelerator))
            {
                result.Add(new { title = label, accelerator });
            }
        }

        // Reads every menu item under an element that already carries an
        // accelerator. Used for both the static pass and each expanded dropdown.
        void ReadItemsUnder(AutomationElement root)
        {
            AutomationElementCollection items;
            try
            {
                items = root.FindAll(TreeScope.Descendants, menuItemCondition);
            }
            catch
            {
                return;
            }

            foreach (AutomationElement item in items)
            {
                if (!WithinBudget())
                {
                    return;
                }

                try
                {
                    Add(
                        item.GetCurrentPropertyValue(AutomationElement.NameProperty) as string,
                        item.GetCurrentPropertyValue(AutomationElement.AcceleratorKeyProperty) as string);
                }
                catch
                {
                    // Element went stale as its menu closed; skip it.
                }
            }
        }

        // Menu bars are far cheaper to scan than an entire window subtree.
        var bars = new List<AutomationElement>();
        var menuBars = window.FindAll(
            TreeScope.Descendants,
            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.MenuBar));
        foreach (AutomationElement bar in menuBars)
        {
            bars.Add(bar);
        }

        if (bars.Count == 0)
        {
            bars.Add(window);
        }

        // Pass 1 (cheap, non-disruptive): collect accelerators already present in
        // the tree. Covers apps that expose them statically (e.g. WinForms/WPF
        // menus). Classic Win32 menus expose only top-level names here.
        foreach (var bar in bars)
        {
            ReadItemsUnder(bar);
            if (!WithinBudget())
            {
                return result;
            }
        }

        // Pass 2 (best-effort, disruptive): classic Win32 dropdown items are
        // absent from the UI Automation tree until their menu is opened. Expand
        // each top-level menu-bar item so its items materialize, read them, then
        // collapse. Guarded so any failure degrades to Pass 1's result.
        foreach (var bar in bars)
        {
            AutomationElementCollection tops;
            try
            {
                tops = bar.FindAll(TreeScope.Children, menuItemCondition);
            }
            catch
            {
                continue;
            }

            foreach (AutomationElement top in tops)
            {
                if (!WithinBudget())
                {
                    return result;
                }

                ExpandAndReadDropdown(top, ReadItemsUnder);
            }
        }

        return result;
    }

    /// <summary>
    /// Expands a top-level menu item via <see cref="ExpandCollapsePattern"/> so
    /// its (lazily created) dropdown items appear, reads their accelerators, then
    /// collapses it. Win32 dropdowns open as a separate popup menu parented to the
    /// desktop root rather than under the menu item, so both locations are read.
    /// No-op for items without the pattern (e.g. leaf items, modern apps).
    /// </summary>
    private static void ExpandAndReadDropdown(
        AutomationElement top,
        Action<AutomationElement> readItemsUnder)
    {
        ExpandCollapsePattern? pattern = null;
        try
        {
            if (top.TryGetCurrentPattern(ExpandCollapsePattern.Pattern, out var raw))
            {
                pattern = (ExpandCollapsePattern)raw;
            }
        }
        catch
        {
            pattern = null;
        }

        if (pattern is null)
        {
            return;
        }

        try
        {
            pattern.Expand();
        }
        catch
        {
            return;
        }

        try
        {
            // Give the dropdown a moment to render its items.
            Thread.Sleep(60);
            readItemsUnder(top);

            var popup = AutomationElement.RootElement.FindFirst(
                TreeScope.Children,
                new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Menu));
            if (popup is not null)
            {
                readItemsUnder(popup);
            }
        }
        catch
        {
            // Reading a transient popup can race its teardown; ignore.
        }
        finally
        {
            try
            {
                pattern.Collapse();
            }
            catch
            {
                // Leave nothing open if collapse fails; best-effort.
            }
        }
    }
}
