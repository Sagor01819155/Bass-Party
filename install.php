<?php
/**
 * Bass Party - 1-Click MySQL Auto Installer
 * Web URL: https://bassparty.free.nf
 * Features: Auto Table Creation, Admin Account Seeding, Config Generation
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$installed = false;
$error = null;
$messages = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = trim($_POST['db_host'] ?? 'localhost');
    $db_name = trim($_POST['db_name'] ?? '');
    $db_user = trim($_POST['db_user'] ?? '');
    $db_pass = trim($_POST['db_pass'] ?? '');
    $admin_email = trim($_POST['admin_email'] ?? 'mdsagorirfan@gmail.com');
    $admin_pass  = trim($_POST['admin_pass'] ?? 'Sagor9155');

    if (empty($db_name) || empty($db_user)) {
        $error = "Database Name এবং Database Username দেওয়া বাধ্যতামূলক!";
    } else {
        try {
            // Test Connection
            $dsn = "mysql:host={$db_host};charset=utf8mb4";
            $pdo = new PDO($dsn, $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // Create database if not exists (if privileges allow)
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$db_name}`");
            $messages[] = "Database '{$db_name}' সফলভাবে কানেক্ট হয়েছে!";

            // Run Schema Queries
            $schemaSql = "
            CREATE TABLE IF NOT EXISTS `users` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `user_id` VARCHAR(32) NOT NULL UNIQUE,
              `name` VARCHAR(100) NOT NULL,
              `email` VARCHAR(150) NOT NULL UNIQUE,
              `password` VARCHAR(255) NOT NULL,
              `avatar` TEXT NULL,
              `is_verified` TINYINT(1) DEFAULT 0,
              `verification_code` VARCHAR(10) NULL,
              `is_admin` TINYINT(1) DEFAULT 0,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX (`email`),
              INDEX (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `rooms` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `room_id` VARCHAR(64) NOT NULL UNIQUE,
              `password` VARCHAR(255) NOT NULL,
              `owner_id` VARCHAR(32) NOT NULL,
              `owner_name` VARCHAR(100) NOT NULL,
              `current_video_id` VARCHAR(64) DEFAULT 'jfKfPfyJRdk',
              `current_title` VARCHAR(255) DEFAULT 'Lofi Hip Hop Radio',
              `is_playing` TINYINT(1) DEFAULT 0,
              `current_time` FLOAT DEFAULT 0,
              `last_synced_at` BIGINT DEFAULT 0,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (`room_id`),
              INDEX (`owner_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `room_members` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `room_id` VARCHAR(64) NOT NULL,
              `user_id` VARCHAR(32) NOT NULL,
              `user_name` VARCHAR(100) NOT NULL,
              `user_avatar` TEXT NULL,
              `is_admin` TINYINT(1) DEFAULT 0,
              `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (`room_id`),
              INDEX (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `friends` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `user_id` VARCHAR(32) NOT NULL,
              `friend_id` VARCHAR(32) NOT NULL,
              `friend_name` VARCHAR(100) NOT NULL,
              `friend_avatar` TEXT NULL,
              `status` VARCHAR(20) DEFAULT 'accepted',
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (`user_id`),
              INDEX (`friend_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `room_invites` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `room_id` VARCHAR(64) NOT NULL,
              `room_password` VARCHAR(255) NOT NULL,
              `from_user_id` VARCHAR(32) NOT NULL,
              `from_user_name` VARCHAR(100) NOT NULL,
              `to_user_id` VARCHAR(32) NOT NULL,
              `status` VARCHAR(20) DEFAULT 'pending',
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (`to_user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `site_settings` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `setting_key` VARCHAR(64) NOT NULL UNIQUE,
              `setting_value` TEXT NULL,
              `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";

            $pdo->exec($schemaSql);
            $messages[] = "সবগুলো ডাটাবেস টেবিল (users, rooms, room_members, friends, room_invites, site_settings) তৈরি হয়েছে!";

            // Seed default settings
            $stmt = $pdo->prepare("INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES 
                ('site_name', 'Bass Party'),
                ('site_logo', '🎵 Bass Party'),
                ('site_url', 'https://bassparty.free.nf'),
                ('accent_color', '#a855f7'),
                ('emailjs_service_id', 'service_bassparty'),
                ('emailjs_template_id', 'template_verification'),
                ('emailjs_public_key', 'user_public_key_here')
                ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)");
            $stmt->execute();
            $messages[] = "সাইটের ডিফল্ট সেটিংস ও EmailJS কনফিগারেশন ইনসার্ট করা হয়েছে!";

            // Seed / Update Admin Account
            $hashed_pass = password_hash($admin_pass, PASSWORD_BCRYPT);
            $adminStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $adminStmt->execute([$admin_email]);
            if ($adminStmt->fetch()) {
                $upd = $pdo->prepare("UPDATE users SET password = ?, is_admin = 1, is_verified = 1 WHERE email = ?");
                $upd->execute([$hashed_pass, $admin_email]);
                $messages[] = "অ্যাডমিন একাউন্ট ($admin_email) পাসওয়ার্ড আপডেট হয়েছে!";
            } else {
                $ins = $pdo->prepare("INSERT INTO users (user_id, name, email, password, is_verified, is_admin) VALUES (?, ?, ?, ?, 1, 1)");
                $ins->execute(['BP-ADMIN01', 'Admin Sagor', $admin_email, $hashed_pass]);
                $messages[] = "সুপার অ্যাডমিন একাউন্ট ($admin_email) সফলভাবে তৈরি করা হয়েছে!";
            }

            // Write db_config.php file
            $configContent = "<?php\n" .
                "// Bass Party Auto-generated Database Configuration\n" .
                "define('DB_HOST', '" . addslashes($db_host) . "');\n" .
                "define('DB_NAME', '" . addslashes($db_name) . "');\n" .
                "define('DB_USER', '" . addslashes($db_user) . "');\n" .
                "define('DB_PASS', '" . addslashes($db_pass) . "');\n\n" .
                "function get_db_connection() {\n" .
                "    static \$pdo = null;\n" .
                "    if (\$pdo === null) {\n" .
                "        \$dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';\n" .
                "        \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, [\n" .
                "            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,\n" .
                "            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC\n" .
                "        ]);\n" .
                "    }\n" .
                "    return \$pdo;\n" .
                "}\n";

            @file_put_contents(__DIR__ . '/db_config.php', $configContent);
            $messages[] = "db_config.php কনফিগ ফাইল সফলভাবে ক্রিয়েট হয়েছে!";

            $installed = true;
        } catch (Exception $e) {
            $error = "ডাটাবেস কানেকশন বা কুয়েরি এরর: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bass Party - MySQL Auto Installer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Hind Siliguri', 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-xl w-full bg-slate-900 border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-900/30 relative overflow-hidden">
        <div class="absolute -right-16 -top-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/40 mb-3 animate-pulse">
                <span class="text-3xl">🔊</span>
            </div>
            <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300">
                Bass Party MySQL Installer
            </h1>
            <p class="text-sm text-slate-400 mt-1">
                শুধু ডাটাবেসের ডিটেইলস দিন, সব টেবিল ও অ্যাডমিন অটোমেটিক সেটআপ হয়ে যাবে!
            </p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-950/80 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                <span>⚠️</span>
                <div><?php echo htmlspecialchars($error); ?></div>
            </div>
        <?php endif; ?>

        <?php if ($installed): ?>
            <div class="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-5 rounded-xl mb-6">
                <div class="flex items-center gap-2 text-lg font-bold text-emerald-400 mb-2">
                    <span>🎉</span> অসাধারণ! ডাটাবেস সম্পূর্ণ ইন্সটল সম্পন্ন হয়েছে!
                </div>
                <ul class="text-sm space-y-1 mb-4 text-emerald-300">
                    <?php foreach ($messages as $msg): ?>
                        <li>✓ <?php echo htmlspecialchars($msg); ?></li>
                    <?php endforeach; ?>
                </ul>
                <div class="bg-slate-950/70 p-3 rounded-lg text-xs space-y-1 border border-emerald-500/30">
                    <div><span class="text-slate-400">অ্যাডমিন ইমেইল:</span> <span class="text-purple-300 font-mono"><?php echo htmlspecialchars($admin_email); ?></span></div>
                    <div><span class="text-slate-400">অ্যাডমিন পাসওয়ার্ড:</span> <span class="text-pink-300 font-mono"><?php echo htmlspecialchars($admin_pass); ?></span></div>
                </div>
            </div>
            <div class="text-center">
                <a href="./" class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold hover:brightness-110 shadow-lg shadow-purple-600/30 transition">
                    Bass Party ওয়েবসাইটে প্রবেশ করুন →
                </a>
            </div>
        <?php else: ?>
            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Database Host</label>
                    <input type="text" name="db_host" value="localhost" required class="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                    <p class="text-[11px] text-slate-500 mt-1">InfinityFree (free.nf) হলে sqlXXX.infinityfree.com দিন</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Database Name *</label>
                        <input type="text" name="db_name" placeholder="epiz_xxxxxx_bassparty" required class="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Database User *</label>
                        <input type="text" name="db_user" placeholder="epiz_xxxxxx" required class="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Database Password</label>
                    <input type="password" name="db_pass" placeholder="MySQL পাসওয়ার্ড" class="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                </div>

                <div class="border-t border-slate-800 pt-4 mt-2">
                    <div class="text-xs text-purple-400 font-semibold mb-2">অ্যাডমিন একাউন্ট সিকিউরিটি (প্রিসেট করা হয়েছে):</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs text-slate-400 mb-1">Admin Email</label>
                            <input type="email" name="admin_email" value="mdsagorirfan@gmail.com" readonly class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300">
                        </div>
                        <div>
                            <label class="block text-xs text-slate-400 mb-1">Admin Password</label>
                            <input type="text" name="admin_pass" value="Sagor9155" readonly class="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300">
                        </div>
                    </div>
                </div>

                <button type="submit" class="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 font-bold text-white shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-[0.98] transition cursor-pointer">
                    ⚡ ১-ক্লিকে ডাটাবেস ইন্সটল করুন
                </button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
