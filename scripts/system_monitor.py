#!/usr/bin/env python3
"""
System monitoring script - Read-only operations
"""
import subprocess
import sys


def check_disk_usage():
    """Check disk usage across mounted filesystems"""
    try:
        result = subprocess.run(
            ['df', '-h'], capture_output=True, text=True, check=True)
        print("=== Disk Usage ===")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error checking disk usage: {e}", file=sys.stderr)
        return 1
    return 0


def check_memory():
    """Check memory usage"""
    try:
        result = subprocess.run(
            ['free', '-h'], capture_output=True, text=True, check=True)
        print("\n=== Memory Usage ===")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error checking memory: {e}", file=sys.stderr)
        return 1
    return 0


def check_processes():
    """List running processes"""
    try:
        result = subprocess.run(
            ['ps', 'aux'], capture_output=True, text=True, check=True)
        print("\n=== Running Processes ===")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error listing processes: {e}", file=sys.stderr)
        return 1
    return 0


def main():
    """Main execution"""
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help']:
        print("System Monitoring Script")
        print("Usage: python3 system_monitor.py")
        print("\nDisplays disk usage, memory usage, and running processes")
        return 0

    exit_code = 0
    exit_code |= check_disk_usage()
    exit_code |= check_memory()
    exit_code |= check_processes()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
