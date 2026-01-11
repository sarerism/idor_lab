#!/usr/bin/env python3
"""
Log rotation script - Secure implementation
Rotates application logs with proper permissions checking
"""
import sys
import os
import gzip
import shutil
from datetime import datetime

LOG_DIRS = [
    '/var/log/apache2',
    '/var/log/mysql',
    '/var/www/logs'
]


def check_permissions():
    """Verify script is run with appropriate permissions"""

    if os.geteuid() != 0:

        try:
            import pwd
            current_user = pwd.getpwuid(os.getuid()).pw_name
            if current_user != 'developer':
                print(
                    "ERROR: This script must be run as developer user or with root privileges")
                print("Please run with sudo or as developer user")
                return False
        except:
            print("ERROR: This script must be run with root privileges")
            print("Please run with sudo or as root user")
            return False
    return True


def rotate_logs(log_dir):
    """Rotate logs in specified directory"""
    if not os.path.exists(log_dir):
        print(f"Directory {log_dir} does not exist, skipping...")
        return True

    print(f"\nRotating logs in {log_dir}:")
    log_files = [f for f in os.listdir(log_dir) if f.endswith('.log')]

    if not log_files:
        print("  No log files found")
        return True

    for log_file in log_files:
        log_path = os.path.join(log_dir, log_file)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        rotated_name = f"{log_file}.{timestamp}.gz"
        rotated_path = os.path.join(log_dir, rotated_name)

        try:

            with open(log_path, 'rb') as f_in:
                with gzip.open(rotated_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)


            open(log_path, 'w').close()
            print(f"  ✓ Rotated: {log_file} -> {rotated_name}")
        except Exception as e:
            print(f"  ✗ Failed to rotate {log_file}: {e}")
            return False

    return True


def main():
    """Main execution"""
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help']:
        print("Log Rotation Utility")
        print("Usage: sudo python3 log_rotation.py")
        print("\nRotates and compresses logs in:")
        for log_dir in LOG_DIRS:
            print(f"  - {log_dir}")
        return 0

    print("Log Rotation Utility")
    print("=" * 50)

    if not check_permissions():
        return 1

    success = True
    for log_dir in LOG_DIRS:
        if not rotate_logs(log_dir):
            success = False

    if success:
        print("\n✓ Log rotation completed successfully")
        return 0
    else:
        print("\n✗ Log rotation completed with errors")
        return 1


if __name__ == "__main__":
    sys.exit(main())
