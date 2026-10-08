export interface BlueprintFile {
  id: string;
  filename: string;
  pathInXampp: string;
  language: 'sql' | 'php' | 'html';
  title: string;
  description: string;
  l4RequirementTag: string;
  code: string;
}

export const XAMPP_BLUEPRINT_FILES: BlueprintFile[] = [
  {
    id: 'mysql-schema',
    filename: 'gmms_database.sql',
    pathInXampp: 'phpMyAdmin -> Import -> gmms_database.sql (Port 3306)',
    language: 'sql',
    title: 'MySQL / MariaDB Relational Schema & Stored Procedure',
    description:
      'Complete DDL and seed script for phpMyAdmin (Port 3306). Implements 3NF relational tables, foreign keys linking Primary Asset Holders to Operational Sub-Tenants, a View for Visual Stall Mapping, and a Stored Procedure for Smart Penalty Automation past the 5th of the month.',
    l4RequirementTag: 'All 3 L4 Requirements (Database Layer)',
    code: `-- ============================================================================
-- PROJECT: GMMS (Government Market Management System - Rwanda)
-- TARGET ENGINE: MySQL / MariaDB (XAMPP Port 3306 / phpMyAdmin)
-- LEVEL: L4 Software Development Technical Assessment
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gmms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gmms_db;

-- 1. MARKETS TABLE (Municipal Market Hubs e.g., Kimironko, Nyabugogo)
CREATE TABLE IF NOT EXISTS markets (
    market_id INT AUTO_INCREMENT PRIMARY KEY,
    market_code VARCHAR(20) NOT NULL UNIQUE,
    market_name VARCHAR(100) NOT NULL,
    district VARCHAR(60) NOT NULL,
    sector VARCHAR(60) NOT NULL,
    total_stalls INT NOT NULL DEFAULT 16,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. VENDORS TABLE (Stores both Primary Asset Holders & Operational Sub-Tenants)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    national_id CHAR(16) NOT NULL UNIQUE COMMENT '16-Digit Rwandan Citizen NID',
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(25) NOT NULL,
    tin_number VARCHAR(20) NOT NULL,
    trade_category VARCHAR(80) NOT NULL,
    vendor_role ENUM('PRIMARY_HOLDER', 'OPERATIONAL_TENANT', 'BOTH') NOT NULL DEFAULT 'PRIMARY_HOLDER',
    registered_at DATE NOT NULL
) ENGINE=InnoDB;

-- 3. STALLS TABLE (Supports Requirement 1: Visual Stall Mapping Grid State)
CREATE TABLE IF NOT EXISTS stalls (
    stall_id INT AUTO_INCREMENT PRIMARY KEY,
    stall_code VARCHAR(20) NOT NULL UNIQUE,
    market_id INT NOT NULL,
    zone_name VARCHAR(60) NOT NULL,
    grid_row INT NOT NULL,
    grid_col INT NOT NULL,
    size_sqm DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    monthly_rent_rwf DECIMAL(12,2) NOT NULL,
    occupancy_status ENUM('AVAILABLE', 'OCCUPIED', 'SUB_LEASED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_stall_market FOREIGN KEY (market_id) REFERENCES markets(market_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. STALL ALLOCATIONS & BILLING LEDGER (Supports Requirement 2: Smart Penalty Automation)
CREATE TABLE IF NOT EXISTS stall_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    stall_id INT NOT NULL,
    primary_vendor_id INT NOT NULL COMMENT 'Citizen authorized by Local Government',
    billing_month CHAR(7) NOT NULL COMMENT 'Format YYYY-MM e.g. 2026-10',
    due_date DATE NOT NULL COMMENT 'Strictly the 5th day of the billing month',
    base_rent_rwf DECIMAL(12,2) NOT NULL,
    paid_amount_rwf DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    days_overdue INT NOT NULL DEFAULT 0,
    statutory_fee_rwf DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '5% flat fee triggered after the 5th',
    daily_penalty_rwf DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '1% per day past the 5th',
    total_penalty_rwf DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PAID', 'PENDING_GRACE', 'OVERDUE_ARREARS', 'PARTIAL') NOT NULL DEFAULT 'PENDING_GRACE',
    last_payment_date DATE NULL,
    CONSTRAINT fk_alloc_stall FOREIGN KEY (stall_id) REFERENCES stalls(stall_id) ON DELETE CASCADE,
    CONSTRAINT fk_alloc_primary_vendor FOREIGN KEY (primary_vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. SUB-LETTING TRACKING LEDGER (Supports Requirement 3: Primary Holder <-> Operational Tenant)
CREATE TABLE IF NOT EXISTS sublease_ledger (
    sublease_id INT AUTO_INCREMENT PRIMARY KEY,
    permit_number VARCHAR(30) NOT NULL UNIQUE,
    allocation_id INT NOT NULL,
    stall_id INT NOT NULL,
    primary_vendor_id INT NOT NULL COMMENT 'Primary Asset Holder (Government Lessee)',
    operational_tenant_id INT NOT NULL COMMENT 'Current Operational Tenant on-site',
    government_base_rent_rwf DECIMAL(12,2) NOT NULL,
    sublease_monthly_charge_rwf DECIMAL(12,2) NOT NULL,
    markup_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        ROUND(((sublease_monthly_charge_rwf - government_base_rent_rwf) / government_base_rent_rwf) * 100, 2)
    ) STORED,
    authorization_status ENUM('AUTHORIZED', 'PENDING_REVIEW', 'MARGIN_VIOLATION') NOT NULL DEFAULT 'AUTHORIZED',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT fk_sub_alloc FOREIGN KEY (allocation_id) REFERENCES stall_allocations(allocation_id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_stall FOREIGN KEY (stall_id) REFERENCES stalls(stall_id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_primary FOREIGN KEY (primary_vendor_id) REFERENCES vendors(vendor_id),
    CONSTRAINT fk_sub_tenant FOREIGN KEY (operational_tenant_id) REFERENCES vendors(vendor_id),
    CONSTRAINT chk_distinct_parties CHECK (primary_vendor_id <> operational_tenant_id)
) ENGINE=InnoDB;

-- 6. PENALTY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS penalty_audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    evaluated_date DATE NOT NULL,
    day_of_month INT NOT NULL,
    accounts_checked INT NOT NULL,
    overdue_flagged INT NOT NULL,
    total_penalties_rwf DECIMAL(14,2) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- STORED PROCEDURE: Smart Fine & Penalty Automation (Past 5th Day of Month)
-- ============================================================================
DELIMITER $$
CREATE PROCEDURE sp_compute_monthly_penalties(IN p_eval_date DATE)
BEGIN
    DECLARE v_day INT;
    DECLARE v_checked INT DEFAULT 0;
    DECLARE v_flagged INT DEFAULT 0;
    DECLARE v_total_penalties DECIMAL(14,2) DEFAULT 0.00;

    SET v_day = DAY(p_eval_date);

    -- Update all unpaid allocations where evaluation date is past the 5th due_date
    UPDATE stall_allocations
    SET
        days_overdue = CASE
            WHEN paid_amount_rwf >= base_rent_rwf THEN 0
            WHEN DATEDIFF(p_eval_date, due_date) > 0 THEN DATEDIFF(p_eval_date, due_date)
            ELSE 0
        END,
        statutory_fee_rwf = CASE
            WHEN paid_amount_rwf < base_rent_rwf AND DATEDIFF(p_eval_date, due_date) > 0
            THEN ROUND((base_rent_rwf - paid_amount_rwf) * 0.05, 2)
            ELSE 0.00
        END,
        daily_penalty_rwf = CASE
            WHEN paid_amount_rwf < base_rent_rwf AND DATEDIFF(p_eval_date, due_date) > 0
            THEN ROUND((base_rent_rwf - paid_amount_rwf) * 0.01 * DATEDIFF(p_eval_date, due_date), 2)
            ELSE 0.00
        END,
        total_penalty_rwf = CASE
            WHEN paid_amount_rwf < base_rent_rwf AND DATEDIFF(p_eval_date, due_date) > 0
            THEN ROUND((base_rent_rwf - paid_amount_rwf) * (0.05 + (0.01 * DATEDIFF(p_eval_date, due_date))), 2)
            ELSE 0.00
        END,
        payment_status = CASE
            WHEN paid_amount_rwf >= base_rent_rwf THEN 'PAID'
            WHEN DATEDIFF(p_eval_date, due_date) > 0 THEN 'OVERDUE_ARREARS'
            WHEN paid_amount_rwf > 0 THEN 'PARTIAL'
            ELSE 'PENDING_GRACE'
        END;

    SELECT COUNT(*) INTO v_checked FROM stall_allocations;
    SELECT COUNT(*), IFNULL(SUM(total_penalty_rwf), 0.00)
      INTO v_flagged, v_total_penalties
      FROM stall_allocations
     WHERE payment_status = 'OVERDUE_ARREARS';

    INSERT INTO penalty_audit_logs (evaluated_date, day_of_month, accounts_checked, overdue_flagged, total_penalties_rwf)
    VALUES (p_eval_date, v_day, v_checked, v_flagged, v_total_penalties);
END$$
DELIMITER ;

-- ============================================================================
-- SEED DATA FOR KIMIRONKO & NYABUGOGO MARKETS
-- ============================================================================
INSERT INTO markets (market_code, market_name, district, sector, total_stalls) VALUES
('KIM-01', 'Kimironko Market', 'Gasabo District', 'Kimironko Sector', 16),
('NYA-02', 'Nyabugogo Market', 'Nyarugenge District', 'Muhima Sector', 16);

INSERT INTO vendors (national_id, full_name, phone_number, tin_number, trade_category, vendor_role, registered_at) VALUES
('1198580041203089', 'Uwimana Marie Claire', '+250 788 412 093', '104892103', 'Fresh Agricultural Produce', 'PRIMARY_HOLDER', '2024-02-14'),
('1197980028910412', 'Habimana Jean Paul', '+250 788 530 118', '103781920', 'Kitenge & Apparel Textiles', 'PRIMARY_HOLDER', '2023-08-01'),
('1199070065120045', 'Mukamana Vestine', '+250 783 901 442', '105903411', 'Dry Grains & Legumes', 'PRIMARY_HOLDER', '2024-05-19'),
('1198280091034517', 'Ndayisaba Eric', '+250 788 619 820', '104112098', 'Agaseke & Artisanal Crafts', 'PRIMARY_HOLDER', '2023-11-10'),
('1199680011294055', 'Tuyisenge Fabrice', '+250 789 104 582', '107110294', 'Tailoring & Kitenge Alterations', 'OPERATIONAL_TENANT', '2026-01-15'),
('1199570088341029', 'Nyirahabimana Claudine', '+250 784 882 319', '107392011', 'Handwoven Baskets & Souvenirs', 'OPERATIONAL_TENANT', '2026-03-01');
`,
  },
  {
    id: 'php-db-config',
    filename: 'db_connect.php',
    pathInXampp: 'C:\\xampp\\htdocs\\gmms\\config\\db_connect.php',
    language: 'php',
    title: 'XAMPP PDO Database Connection Class (Port 3306)',
    description:
      'Singleton PHP PDO database connector configured for XAMPP MariaDB/MySQL on Port 3306 with strict error reporting and associative array fetching.',
    l4RequirementTag: 'Core XAMPP Stack Foundation',
    code: `<?php
/**
 * GMMS - Government Market Management System
 * File: config/db_connect.php
 * Environment: XAMPP Apache (Port 80) + MySQL/MariaDB (Port 3306)
 */

declare(strict_types=1);

class DatabaseConnection {
    private static ?PDO $instance = null;

    private const DB_HOST = '127.0.0.1';
    private const DB_PORT = '3306';
    private const DB_NAME = 'gmms_db';
    private const DB_USER = 'root';
    private const DB_PASS = ''; // Default XAMPP root password is empty

    private function __construct() {}

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
                self::DB_HOST,
                self::DB_PORT,
                self::DB_NAME
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, self::DB_USER, self::DB_PASS, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'status'  => 'error',
                    'message' => 'GMMS Database Connection Failed on Port 3306: ' . $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$instance;
    }
}
`,
  },
  {
    id: 'php-api-controller',
    filename: 'api.php',
    pathInXampp: 'C:\\xampp\\htdocs\\gmms\\api\\api.php',
    language: 'php',
    title: 'Server-Side PHP Core API (Stall Map, Sub-Letting & Allocations)',
    description:
      'RESTful PHP controller serving JSON data state arrays for the Visual Stall Mapping grid, relational Sub-Letting joins (Primary Asset Holder vs Operational Tenant), and new stall registrations.',
    l4RequirementTag: 'Requirement 1 (Visual Grid) & Requirement 3 (Sub-Letting)',
    code: `<?php
/**
 * GMMS - Government Market Management System
 * File: api/api.php
 * Description: Provides JSON state arrays for Visual Stall Mapping,
 *              Vendor Sub-Letting relational tracking, and Stall Allocation.
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

require_once __DIR__ . '/../config/db_connect.php';

$pdo = DatabaseConnection::getConnection();
$action = $_GET['action'] ?? 'dashboard_state';

try {
    switch ($action) {
        // ====================================================================
        // L4 REQUIREMENT 1: VISUAL STALL MAPPING DATA STATE ARRAY
        // ====================================================================
        case 'stall_map':
            $marketCode = $_GET['market'] ?? null;
            $sql = "
                SELECT 
                    s.stall_id,
                    s.stall_code,
                    s.zone_name,
                    s.grid_row,
                    s.grid_col,
                    s.size_sqm,
                    s.monthly_rent_rwf,
                    s.occupancy_status,
                    m.market_name,
                    m.market_code,
                    v_primary.full_name AS primary_holder_name,
                    v_primary.national_id AS primary_holder_nid,
                    a.payment_status,
                    a.days_overdue,
                    a.total_penalty_rwf,
                    v_sub.full_name AS operational_tenant_name,
                    sl.permit_number AS sublease_permit
                FROM stalls s
                INNER JOIN markets m ON s.market_id = m.market_id
                LEFT JOIN stall_allocations a ON s.stall_id = a.stall_id
                LEFT JOIN vendors v_primary ON a.primary_vendor_id = v_primary.vendor_id
                LEFT JOIN sublease_ledger sl ON a.allocation_id = sl.allocation_id
                LEFT JOIN vendors v_sub ON sl.operational_tenant_id = v_sub.vendor_id
            ";
            if ($marketCode) {
                $sql .= " WHERE m.market_code = :market_code ";
            }
            $sql .= " ORDER BY m.market_id ASC, s.grid_row ASC, s.grid_col ASC";

            $stmt = $pdo->prepare($sql);
            if ($marketCode) {
                $stmt->execute(['market_code' => $marketCode]);
            } else {
                $stmt->execute();
            }
            $stalls = $stmt->fetchAll();

            // Color-code state mapping for frontend interactive grid
            $mappedGrid = array_map(function(array $row): array {
                $colorCode = match($row['occupancy_status']) {
                    'AVAILABLE'   => 'emerald', // Vacant & Ready for Allocation
                    'OCCUPIED'    => ($row['payment_status'] === 'OVERDUE_ARREARS' ? 'crimson' : 'slate'),
                    'SUB_LEASED'  => 'amber',   // Primary Holder sub-leasing to Operational Tenant
                    'MAINTENANCE' => 'neutral',
                    default       => 'slate'
                };
                $row['ui_color_token'] = $colorCode;
                return $row;
            }, $stalls);

            echo json_encode(['status' => 'success', 'grid_state' => $mappedGrid]);
            break;

        // ====================================================================
        // L4 REQUIREMENT 3: VENDOR SUB-LETTING RELATIONAL TRACKING LEDGER
        // ====================================================================
        case 'sublease_ledger':
            $sql = "
                SELECT 
                    sl.sublease_id,
                    sl.permit_number,
                    s.stall_code,
                    m.market_name,
                    p.vendor_id AS primary_holder_id,
                    p.full_name AS primary_holder_name,
                    p.national_id AS primary_holder_nid,
                    p.phone_number AS primary_holder_phone,
                    t.vendor_id AS operational_tenant_id,
                    t.full_name AS operational_tenant_name,
                    t.national_id AS operational_tenant_nid,
                    t.phone_number AS operational_tenant_phone,
                    t.trade_category AS operational_trade,
                    sl.government_base_rent_rwf,
                    sl.sublease_monthly_charge_rwf,
                    sl.markup_percentage,
                    sl.authorization_status,
                    sl.start_date,
                    sl.end_date
                FROM sublease_ledger sl
                INNER JOIN stalls s ON sl.stall_id = s.stall_id
                INNER JOIN markets m ON s.market_id = m.market_id
                INNER JOIN vendors p ON sl.primary_vendor_id = p.vendor_id
                INNER JOIN vendors t ON sl.operational_tenant_id = t.vendor_id
                ORDER BY sl.sublease_id DESC
            ";
            $stmt = $pdo->query($sql);
            echo json_encode([
                'status' => 'success',
                'sublease_relationships' => $stmt->fetchAll()
            ]);
            break;

        // ====================================================================
        // REGISTER NEW STALL ALLOCATION (POST)
        // ====================================================================
        case 'register_allocation':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new RuntimeException('POST method required');
            }
            $payload = json_decode(file_get_contents('php://input'), true);
            $pdo->beginTransaction();

            // 1. Insert or locate Primary Vendor
            $stmtVendor = $pdo->prepare("
                INSERT INTO vendors (national_id, full_name, phone_number, tin_number, trade_category, vendor_role, registered_at)
                VALUES (:nid, :name, :phone, :tin, :trade, 'PRIMARY_HOLDER', CURDATE())
            ");
            $stmtVendor->execute([
                'nid'   => $payload['national_id'],
                'name'  => $payload['vendor_name'],
                'phone' => $payload['phone'],
                'tin'   => $payload['tin'] ?? '105000000',
                'trade' => $payload['trade_category'] ?? 'General Merchandise'
            ]);
            $vendorId = (int)$pdo->lastInsertId();

            // 2. Mark Stall as OCCUPIED
            $stmtStall = $pdo->prepare("UPDATE stalls SET occupancy_status = 'OCCUPIED' WHERE stall_id = :stall_id");
            $stmtStall->execute(['stall_id' => $payload['stall_id']]);

            // 3. Create Billing Allocation with 5th of Month Due Date
            $billingMonth = date('Y-m');
            $dueDate = $billingMonth . '-05';
            $stmtAlloc = $pdo->prepare("
                INSERT INTO stall_allocations (stall_id, primary_vendor_id, billing_month, due_date, base_rent_rwf)
                VALUES (:stall_id, :vendor_id, :billing_month, :due_date, :base_rent)
            ");
            $stmtAlloc->execute([
                'stall_id'      => $payload['stall_id'],
                'vendor_id'     => $vendorId,
                'billing_month' => $billingMonth,
                'due_date'      => $dueDate,
                'base_rent'     => $payload['base_rent_rwf']
            ]);

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Stall allocated and grid state updated.']);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Unknown API action']);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
`,
  },
  {
    id: 'php-cron-penalties',
    filename: 'cron_penalties.php',
    pathInXampp: 'C:\\xampp\\htdocs\\gmms\\cron\\cron_penalties.php',
    language: 'php',
    title: 'Smart Fine & Penalty Automation Script (Past 5th of Month)',
    description:
      'Automated PHP backend cron script that inspects the current calendar date against the 5th day of the month threshold, calculates the 5% statutory fee + 1% daily cumulative penalty on unpaid balances, and logs the municipal revenue audit.',
    l4RequirementTag: 'Requirement 2 (Smart Fine & Penalty Automation)',
    code: `<?php
/**
 * GMMS - Government Market Management System
 * File: cron/cron_penalties.php
 * L4 Requirement 2: Smart Fine & Penalty Automation
 *
 * Execution via XAMPP CLI / Windows Task Scheduler:
 * C:\\xampp\\php\\php.exe C:\\xampp\\htdocs\\gmms\\cron\\cron_penalties.php
 * Or via HTTP trigger: http://localhost/gmms/cron/cron_penalties.php?sim_date=2026-10-08
 */

declare(strict_types=1);
require_once __DIR__ . '/../config/db_connect.php';

class SmartPenaltyAutomationEngine {
    private PDO $db;
    private const GRACE_DEADLINE_DAY = 5;       // 5th day of calendar month
    private const STATUTORY_LATE_RATE = 0.05;   // 5% initial penalty on Day 6
    private const DAILY_CUMULATIVE_RATE = 0.01; // +1% per calendar day overdue past the 5th

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function runMonthlyArrearsAudit(string $evaluationDate): array {
        $evalTimestamp = strtotime($evaluationDate);
        $dayOfMonth = (int)date('j', $evalTimestamp);
        $isPastFifth = $dayOfMonth > self::GRACE_DEADLINE_DAY;

        // Fetch all active allocations for the current billing cycle
        $stmt = $this->db->query("
            SELECT allocation_id, stall_id, base_rent_rwf, paid_amount_rwf, due_date
            FROM stall_allocations
        ");
        $allocations = $stmt->fetchAll();

        $overdueCount = 0;
        $totalPenaltiesAssessed = 0.0;

        $updateStmt = $this->db->prepare("
            UPDATE stall_allocations
            SET days_overdue = :days_overdue,
                statutory_fee_rwf = :statutory_fee,
                daily_penalty_rwf = :daily_penalty,
                total_penalty_rwf = :total_penalty,
                payment_status = :status
            WHERE allocation_id = :id
        ");

        foreach ($allocations as $alloc) {
            $unpaidArrears = max(0.0, (float)$alloc['base_rent_rwf'] - (float)$alloc['paid_amount_rwf']);

            if ($unpaidArrears <= 0.0) {
                $updateStmt->execute([
                    'days_overdue'  => 0,
                    'statutory_fee' => 0,
                    'daily_penalty' => 0,
                    'total_penalty' => 0,
                    'status'        => 'PAID',
                    'id'            => $alloc['allocation_id']
                ]);
                continue;
            }

            // Compute exact days elapsed past the 5th of the month
            $dueTimestamp = strtotime($alloc['due_date']);
            $daysPastFifth = max(0, (int)floor(($evalTimestamp - $dueTimestamp) / 86400));

            if (!$isPastFifth || $daysPastFifth <= 0) {
                $status = ((float)$alloc['paid_amount_rwf'] > 0) ? 'PARTIAL' : 'PENDING_GRACE';
                $updateStmt->execute([
                    'days_overdue'  => 0,
                    'statutory_fee' => 0,
                    'daily_penalty' => 0,
                    'total_penalty' => 0,
                    'status'        => $status,
                    'id'            => $alloc['allocation_id']
                ]);
                continue;
            }

            // Cumulative Penalty Formula past the 5th of the month
            $statutoryFee = round($unpaidArrears * self::STATUTORY_LATE_RATE, 2);
            $dailyCumulative = round($unpaidArrears * self::DAILY_CUMULATIVE_RATE * $daysPastFifth, 2);
            $totalPenalty = $statutoryFee + $dailyCumulative;

            $updateStmt->execute([
                'days_overdue'  => $daysPastFifth,
                'statutory_fee' => $statutoryFee,
                'daily_penalty' => $dailyCumulative,
                'total_penalty' => $totalPenalty,
                'status'        => 'OVERDUE_ARREARS',
                'id'            => $alloc['allocation_id']
            ]);

            $overdueCount++;
            $totalPenaltiesAssessed += $totalPenalty;
        }

        // Record audit entry in penalty_audit_logs
        $logStmt = $this->db->prepare("
            INSERT INTO penalty_audit_logs (evaluated_date, day_of_month, accounts_checked, overdue_flagged, total_penalties_rwf)
            VALUES (:eval_date, :day_num, :checked, :flagged, :total_penalties)
        ");
        $logStmt->execute([
            'eval_date'       => $evaluationDate,
            'day_num'         => $dayOfMonth,
            'checked'         => count($allocations),
            'flagged'         => $overdueCount,
            'total_penalties' => $totalPenaltiesAssessed
        ]);

        return [
            'evaluated_date'          => $evaluationDate,
            'day_of_month'            => $dayOfMonth,
            'past_fifth_threshold'    => $isPastFifth,
            'accounts_evaluated'      => count($allocations),
            'overdue_accounts_flagged'=> $overdueCount,
            'total_penalties_rwf'     => $totalPenaltiesAssessed
        ];
    }
}

$pdo = DatabaseConnection::getConnection();
$engine = new SmartPenaltyAutomationEngine($pdo);
$targetDate = $_GET['sim_date'] ?? date('Y-m-d');
$report = $engine->runMonthlyArrearsAudit($targetDate);

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json');
}
echo json_encode(['status' => 'success', 'audit_report' => $report], JSON_PRETTY_PRINT);
`,
  },
  {
    id: 'completed-index-html',
    filename: 'index.html',
    pathInXampp: 'C:\\xampp\\htdocs\\gmms\\index.html',
    language: 'html',
    title: 'Completed Standalone index.html (HTML5 + Tailwind CDN + OOP Vanilla JS)',
    description:
      'Completes your exact index.html source code snippet from the prompt! Includes the full systemVendors state array, interactive Visual Stall Grid, Smart Penalty Automation past the 5th, Sub-Letting relational ledger, search filtering, and modal submission logic.',
    l4RequirementTag: 'Completed User index.html Base',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GMMS - Government Market Management System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body class="bg-gray-100 font-sans antialiased flex h-screen overflow-hidden">
    <aside id="sidebar" class="w-64 bg-slate-900 text-white flex flex-col justify-between hidden md:flex z-20 shadow-xl fixed md:relative h-full transition-transform duration-300">
        <div>
            <div class="p-5 bg-slate-950 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-building-flag text-emerald-400 text-2xl"></i>
                    <span class="font-bold text-lg tracking-wider">GMMS Portal</span>
                </div>
                <button id="closeSidebarBtn" class="md:hidden text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div class="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/50">
                <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-900 shadow">L4</div>
                <div>
                    <h4 class="text-sm font-semibold">Admin Officer</h4>
                    <span class="text-xs text-emerald-400"><i class="fa-solid fa-circle text-[8px] animate-pulse mr-1"></i> Active Session</span>
                </div>
            </div>
            <nav class="mt-6 px-3 space-y-1">
                <a href="#dashboard" class="flex items-center space-x-3 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-md"><i class="fa-solid fa-chart-pie w-5 text-center"></i><span>Dashboard</span></a>
                <a href="#stallMapSection" class="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-all"><i class="fa-solid fa-shop w-5 text-center"></i><span>Market & Stalls</span></a>
                <a href="#vendorSection" class="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg font-medium transition-all"><i class="fa-solid fa-users w-5 text-center"></i><span>Vendor Register</span></a>
            </nav>
        </div>
        <div class="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 text-center">&copy; 2026 GMMS L4 Project</div>
    </aside>

    <main class="flex-1 flex flex-col h-full overflow-y-auto">
        <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
            <div class="flex items-center space-x-3">
                <button id="mobileMenuBtn" class="md:hidden text-gray-600 focus:outline-none hover:text-emerald-600"><i class="fa-solid fa-bars text-xl"></i></button>
                <h1 class="text-xl font-bold text-gray-800">Government Market Management System</h1>
            </div>
            <div class="flex items-center space-x-3 text-xs">
                <label class="font-semibold text-gray-600">Simulated Date:</label>
                <input type="date" id="simulatedDateInput" value="2026-10-08" class="border border-gray-300 rounded px-2 py-1 text-gray-800 font-mono">
                <button id="runPenaltyCronBtn" class="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-semibold transition">Run 5th-Day Penalty Cron</button>
            </div>
        </header>

        <div class="p-6 space-y-6 max-w-7xl w-full mx-auto">
            <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-xl md:text-2xl font-bold">Welcome to GMMS Command!</h2>
                    <p class="text-emerald-100 text-sm mt-1">Real-time supervision of active public marketplaces, operational stalls, and localized revenue analytics.</p>
                </div>
                <button id="openModalBtn" class="bg-white text-emerald-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-all shadow"><i class="fa-solid fa-plus mr-1"></i> Register New Stall</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div><span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Allocated Stalls</span><h3 class="text-2xl font-bold text-gray-800 font-mono" id="metricStalls">0</h3></div>
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl"><i class="fa-solid fa-border-all"></i></div>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div><span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified Vendors</span><h3 class="text-2xl font-bold text-gray-800 font-mono" id="metricVendors">0</h3></div>
                    <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl"><i class="fa-solid fa-id-card"></i></div>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div><span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Sub-Leased Units</span><h3 class="text-2xl font-bold text-gray-800 font-mono" id="metricSubleases">0</h3></div>
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl"><i class="fa-solid fa-people-arrows"></i></div>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div><span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Arrears Penalties</span><h3 class="text-2xl font-bold text-red-600 font-mono" id="metricPenalties">RWF 0</h3></div>
                    <div class="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl"><i class="fa-solid fa-scale-balanced"></i></div>
                </div>
            </div>

            <!-- L4 Requirement 1: Visual Stall Mapping Grid -->
            <div id="stallMapSection" class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">1. Visual Stall Mapping Grid</h3>
                        <p class="text-xs text-gray-500">Live occupancy state array across Kimironko & Nyabugogo Market Hubs</p>
                    </div>
                    <div class="flex gap-4 text-xs font-medium text-gray-600">
                        <span><strong class="text-emerald-600">Available</strong> (Vacant)</span>
                        <span>·</span>
                        <span><strong class="text-slate-800">Occupied</strong> (Compliant)</span>
                        <span>·</span>
                        <span><strong class="text-amber-600">Sub-Leased</strong> (Tenant Linked)</span>
                        <span>·</span>
                        <span><strong class="text-red-600">Overdue</strong> (Past 5th Penalty)</span>
                    </div>
                </div>
                <div id="visualStallGrid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3"></div>
            </div>

            <!-- L4 Requirement 2 & 3: Active Vendor Allocation, Smart Penalties & Sub-Letting -->
            <div id="vendorSection" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">2 & 3. Active Vendor Allocation, Sub-Letting & Arrears Ledger</h3>
                        <p class="text-xs text-gray-500">Tracks Primary Asset Holder vs. Operational Tenant and automated penalties past the 5th of the month</p>
                    </div>
                    <input type="text" id="tableSearch" placeholder="Search vendor, tenant, or hub..." class="w-full sm:w-64 pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500">
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr class="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                                <th class="p-4">Primary Asset Holder</th>
                                <th class="p-4">Operational Sub-Tenant</th>
                                <th class="p-4">Market & Stall</th>
                                <th class="p-4">Base Rent & Penalty</th>
                                <th class="p-4">Compliance Status</th>
                                <th class="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="vendorTableBody" class="divide-y divide-gray-100 text-sm text-gray-700"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <!-- Registration Modal -->
    <div id="registrationModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center hidden z-50 p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div class="bg-slate-950 p-4 text-white flex justify-between items-center">
                <h3 class="font-bold text-lg">Register New Allocation</h3>
                <button id="closeModalBtn" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form id="vendorForm" class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Asset Holder Name</label>
                    <input type="text" id="vendorName" required class="w-full p-2.5 border rounded-lg text-sm" placeholder="e.g. Uwimana Marie Claire">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Operational Sub-Tenant (Optional)</label>
                    <input type="text" id="subTenantName" class="w-full p-2.5 border rounded-lg text-sm" placeholder="Leave blank if self-operated">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Market Hub</label>
                        <select id="marketHub" class="w-full p-2.5 border rounded-lg text-sm bg-white">
                            <option value="Kimironko Market">Kimironko Market</option>
                            <option value="Nyabugogo Market">Nyabugogo Market</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Rent (RWF)</label>
                        <input type="number" id="baseRent" value="75000" required class="w-full p-2.5 border rounded-lg text-sm font-mono">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                    <input type="tel" id="vendorPhone" required class="w-full p-2.5 border rounded-lg text-sm font-mono" placeholder="+250 788 000 000">
                </div>
                <div class="flex justify-end space-x-2">
                    <button type="button" id="cancelFormBtn" class="px-4 py-2 border rounded-lg text-sm text-gray-700">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Save Asset</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let systemVendors = [
            {
                id: 1,
                primaryHolder: "Uwimana Marie Claire",
                nid: "1198580041203089",
                subTenant: null,
                market: "Kimironko Market",
                stallNumber: "KIM-A01",
                phone: "+250 788 412 093",
                baseRent: 60000,
                paid: true,
                dueDate: "2026-10-05"
            },
            {
                id: 2,
                primaryHolder: "Habimana Jean Paul",
                nid: "1197980028910412",
                subTenant: "Tuyisenge Fabrice",
                market: "Kimironko Market",
                stallNumber: "KIM-B01",
                phone: "+250 788 530 118",
                baseRent: 90000,
                paid: false,
                dueDate: "2026-10-05"
            },
            {
                id: 3,
                primaryHolder: "Mugisha Patrick",
                nid: "1198880077231094",
                subTenant: "Uwase Sandrine",
                market: "Nyabugogo Market",
                stallNumber: "NYA-A01",
                phone: "+250 788 309 551",
                baseRent: 120000,
                paid: true,
                dueDate: "2026-10-05"
            },
            {
                id: 4,
                primaryHolder: "Nkurunziza Emmanuel",
                nid: "1198480055192031",
                subTenant: null,
                market: "Nyabugogo Market",
                stallNumber: "NYA-A02",
                phone: "+250 788 742 310",
                baseRent: 120000,
                paid: false,
                dueDate: "2026-10-05"
            }
        ];

        const vacantStallPool = ["KIM-A02", "KIM-A04", "KIM-B03", "KIM-C02", "NYA-A03", "NYA-B02", "NYA-C02", "NYA-D02"];

        function computeSmartPenalty(vendor, evalDateStr) {
            if (vendor.paid) return { daysOverdue: 0, penaltyRwf: 0, statusLabel: "Paid · Compliant" };
            const evalDay = parseInt(evalDateStr.split("-")[2], 10);
            if (evalDay <= 5) return { daysOverdue: 0, penaltyRwf: 0, statusLabel: "Grace Period (Due 5th)" };
            const daysOverdue = evalDay - 5;
            const penaltyRwf = Math.round(vendor.baseRent * (0.05 + 0.01 * daysOverdue));
            return { daysOverdue, penaltyRwf, statusLabel: \`Overdue (\${daysOverdue}d past 5th)\` };
        }

        function renderGMMS(filterText = "") {
            const evalDate = document.getElementById("simulatedDateInput").value;
            const tbody = document.getElementById("vendorTableBody");
            const grid = document.getElementById("visualStallGrid");
            tbody.innerHTML = "";
            grid.innerHTML = "";

            let totalPenalties = 0;
            let subLeaseCount = 0;

            const filtered = systemVendors.filter(v =>
                v.primaryHolder.toLowerCase().includes(filterText.toLowerCase()) ||
                (v.subTenant && v.subTenant.toLowerCase().includes(filterText.toLowerCase())) ||
                v.market.toLowerCase().includes(filterText.toLowerCase()) ||
                v.stallNumber.toLowerCase().includes(filterText.toLowerCase())
            );

            filtered.forEach(vendor => {
                const pen = computeSmartPenalty(vendor, evalDate);
                totalPenalties += pen.penaltyRwf;
                if (vendor.subTenant) subLeaseCount++;

                const tr = document.createElement("tr");
                tr.className = "hover:bg-gray-50 transition";
                tr.innerHTML = \`
                    <td class="p-4">
                        <div class="font-semibold text-gray-900">\${vendor.primaryHolder}</div>
                        <div class="text-xs text-gray-500 font-mono">NID: \${vendor.nid} · \${vendor.phone}</div>
                    </td>
                    <td class="p-4">
                        \${vendor.subTenant
                            ? \`<div class="font-medium text-amber-800">\${vendor.subTenant}</div><div class="text-xs text-amber-600">Authorized Sub-Tenant</div>\`
                            : \`<span class="text-xs text-gray-400">Self-Operated by Primary Holder</span>\`}
                    </td>
                    <td class="p-4">
                        <div class="font-medium text-gray-800">\${vendor.market}</div>
                        <div class="text-xs font-mono text-gray-500">Stall \${vendor.stallNumber}</div>
                    </td>
                    <td class="p-4 font-mono">
                        <div>RWF \${vendor.baseRent.toLocaleString()}</div>
                        \${pen.penaltyRwf > 0 ? \`<div class="text-xs text-red-600 font-semibold">+ RWF \${pen.penaltyRwf.toLocaleString()} Fine</div>\` : \`<div class="text-xs text-gray-400">RWF 0 Penalty</div>\`}
                    </td>
                    <td class="p-4">
                        <span class="text-xs font-semibold \${vendor.paid ? 'text-emerald-700' : pen.penaltyRwf > 0 ? 'text-red-600' : 'text-amber-600'}">\${pen.statusLabel}</span>
                    </td>
                    <td class="p-4 text-center space-x-2">
                        <button onclick="togglePayment(\${vendor.id})" class="text-xs px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 font-medium">\${vendor.paid ? 'Mark Unpaid' : 'Settle RWF'}</button>
                    </td>
                \`;
                tbody.appendChild(tr);
            });

            // Render Visual Stall Grid (Occupied/Sub-Leased + Available Stalls)
            systemVendors.forEach(v => {
                const pen = computeSmartPenalty(v, evalDate);
                const borderClass = pen.penaltyRwf > 0 ? "border-red-500 bg-red-50/60" : v.subTenant ? "border-amber-500 bg-amber-50/60" : "border-slate-300 bg-slate-50";
                grid.innerHTML += \`
                    <div class="p-3 rounded-lg border-2 \${borderClass} flex flex-col justify-between">
                        <div class="flex justify-between items-center">
                            <span class="font-mono font-bold text-xs text-slate-900">\${v.stallNumber}</span>
                            <span class="text-[11px] font-semibold \${pen.penaltyRwf > 0 ? 'text-red-700' : v.subTenant ? 'text-amber-700' : 'text-slate-700'}">\${pen.penaltyRwf > 0 ? 'Overdue' : v.subTenant ? 'Sub-Leased' : 'Occupied'}</span>
                        </div>
                        <div class="mt-2 text-xs font-medium text-gray-800 truncate">\${v.primaryHolder}</div>
                        <div class="text-[11px] text-gray-500 truncate">\${v.subTenant ? 'Tenant: ' + v.subTenant : v.market}</div>
                    </div>
                \`;
            });

            vacantStallPool.forEach(code => {
                grid.innerHTML += \`
                    <div class="p-3 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/40 flex flex-col justify-between">
                        <div class="flex justify-between items-center">
                            <span class="font-mono font-bold text-xs text-emerald-900">\${code}</span>
                            <span class="text-[11px] font-semibold text-emerald-700">Available</span>
                        </div>
                        <div class="mt-2 text-xs text-emerald-800">Ready for Allocation</div>
                        <div class="text-[11px] text-emerald-600 font-mono">RWF 75,000 / mo</div>
                    </div>
                \`;
            });

            document.getElementById("metricStalls").textContent = systemVendors.length;
            document.getElementById("metricVendors").textContent = systemVendors.length + subLeaseCount;
            document.getElementById("metricSubleases").textContent = subLeaseCount;
            document.getElementById("metricPenalties").textContent = "RWF " + totalPenalties.toLocaleString();
        }

        window.togglePayment = function(id) {
            const target = systemVendors.find(v => v.id === id);
            if (target) {
                target.paid = !target.paid;
                renderGMMS(document.getElementById("tableSearch").value);
            }
        };

        document.getElementById("tableSearch").addEventListener("input", e => renderGMMS(e.target.value));
        document.getElementById("runPenaltyCronBtn").addEventListener("click", () => renderGMMS(document.getElementById("tableSearch").value));
        document.getElementById("simulatedDateInput").addEventListener("change", () => renderGMMS(document.getElementById("tableSearch").value));

        const modal = document.getElementById("registrationModal");
        document.getElementById("openModalBtn").addEventListener("click", () => modal.classList.remove("hidden"));
        document.getElementById("closeModalBtn").addEventListener("click", () => modal.classList.add("hidden"));
        document.getElementById("cancelFormBtn").addEventListener("click", () => modal.classList.add("hidden"));

        document.getElementById("vendorForm").addEventListener("submit", e => {
            e.preventDefault();
            const stallCode = vacantStallPool.shift() || "KIM-D04";
            systemVendors.push({
                id: Date.now(),
                primaryHolder: document.getElementById("vendorName").value,
                nid: "11990800" + Math.floor(10000000 + Math.random() * 89999999),
                subTenant: document.getElementById("subTenantName").value.trim() || null,
                market: document.getElementById("marketHub").value,
                stallNumber: stallCode,
                phone: document.getElementById("vendorPhone").value,
                baseRent: Number(document.getElementById("baseRent").value) || 75000,
                paid: false,
                dueDate: "2026-10-05"
            });
            e.target.reset();
            modal.classList.add("hidden");
            renderGMMS();
        });

        renderGMMS();
    </script>
</body>
</html>`,
  },
];
