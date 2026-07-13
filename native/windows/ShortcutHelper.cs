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

                apps.Add(new { id = process.ProcessName, name = title, pid = process.Id });
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
            var title = process.MainWindowTitle;
            return new
            {
                id = process.ProcessName,
                name = string.IsNullOrWhiteSpace(title) ? process.ProcessName : title,
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

        var cache = new CacheRequest();
        cache.Add(AutomationElement.NameProperty);
        cache.Add(AutomationElement.AcceleratorKeyProperty);

        // Menu bars are far cheaper to scan than an entire window subtree.
        var roots = new List<AutomationElement>();
        var menuBars = window.FindAll(
            TreeScope.Descendants,
            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.MenuBar));
        foreach (AutomationElement bar in menuBars)
        {
            roots.Add(bar);
        }

        if (roots.Count == 0)
        {
            roots.Add(window);
        }

        var seen = new HashSet<string>();
        var menuItemCondition = new PropertyCondition(
            AutomationElement.ControlTypeProperty, ControlType.MenuItem);

        foreach (var root in roots)
        {
            AutomationElementCollection items;
            using (cache.Activate())
            {
                items = root.FindAll(TreeScope.Descendants, menuItemCondition);
            }

            foreach (AutomationElement item in items)
            {
                if (result.Count >= MaxMenuItems)
                {
                    return result;
                }

                var accelerator = item.GetCachedPropertyValue(
                    AutomationElement.AcceleratorKeyProperty) as string;
                if (string.IsNullOrWhiteSpace(accelerator))
                {
                    continue;
                }

                var title = item.GetCachedPropertyValue(
                    AutomationElement.NameProperty) as string ?? string.Empty;

                if (seen.Add(title + "\u0000" + accelerator))
                {
                    result.Add(new { title, accelerator });
                }
            }
        }

        return result;
    }
}
