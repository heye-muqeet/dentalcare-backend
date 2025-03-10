CREATE TABLE Organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE Branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    organization_id INT NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(20) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (organization_id) REFERENCES Organizations(id)
);

CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_no VARCHAR(20) UNIQUE NOT NULL,
    identity_no VARCHAR(50) UNIQUE NOT NULL,
    avatar VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('doctor', 'receptionist', 'branch_admin', 'organization_admin') NOT NULL,
    branch_id INT,
    organization_id INT NOT NULL,
    identity_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (branch_id) REFERENCES Branches(id)
    FOREIGN KEY (organization_id) REFERENCES Organizations(id)
);

CREATE TABLE Patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    id_card_no VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    date_of_birth DATE CHECK (date_of_birth <= CURDATE()),
    address TEXT,
    medical_history TEXT,
    allergies TEXT,
    branch_id INT NOT NULL,
    patient_type ENUM('walk-in', 'regular', 'appointed') DEFAULT 'walk-in',
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (branch_id) REFERENCES Branches(id),
    FOREIGN KEY (created_by) REFERENCES Users(id),
    FOREIGN KEY (updated_by) REFERENCES Users(id)
);

CREATE TABLE Appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT,
    receptionist_id INT,
    appointment_date DATE NOT NULL CHECK (appointment_date >= CURDATE()),
    appointment_time TIME,
    type ENUM('scheduled', 'walk-in') DEFAULT 'scheduled',
    status ENUM('scheduled', 'expired', 'waiting', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    is_final_appointment BOOLEAN DEFAULT TRUE,
    treatment_plan TEXT,
    created_by_id INT NOT NULL,
    updated_by_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES Users(id),
    FOREIGN KEY (receptionist_id) REFERENCES Users(id)
    FOREIGN KEY (created_by_id) REFERENCES Users(id)
    FOREIGN KEY (updated_by_id) REFERENCES Users(id)
);

CREATE TABLE Treatments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    treatment_name VARCHAR(255) NOT NULL,
    description TEXT,
    base_cost DECIMAL(10,2) NOT NULL, -- Average or typical cost
    duration INT NOT NULL COMMENT 'Duration in minutes',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE Patient_Treatments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    treatment_id INT NOT NULL,
    appointment_id INT NOT NULL,
    session_number INT NOT NULL DEFAULT 1, -- Session number of patient for this treatment
    treatment_date DATE NOT NULL,
    actual_cost DECIMAL(10,2) NOT NULL, -- Actual cost for this patient
    doctor_id INT NOT NULL,
    status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (treatment_id) REFERENCES Treatments(id),
    FOREIGN KEY (appointment_id) REFERENCES Appointments(id),
    FOREIGN KEY (doctor_id) REFERENCES Users(id)
);

CREATE TABLE Patient_Bills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    treatment_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status ENUM('paid', 'partially_paid', 'pending') DEFAULT 'pending',
    FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE
    FOREIGN KEY (treatment_id) REFERENCES Treatment(id)
);

CREATE TABLE Payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bill_id INT NOT NULL,
    patient_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'card', 'online') NOT NULL,
    status ENUM('paid', 'pending') DEFAULT 'pending',
    received_by_id INT NOT NULL,
    FOREIGN KEY (received_by_id) REFERENCES Users(id),
    FOREIGN KEY (patient_id) REFERENCES Patients(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES Patient_Bills(id) ON DELETE CASCADE
);


CREATE TABLE Expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    organization_id INT NOT NULL,
    expense_name VARCHAR(255) NOT NULL,
    expense_type ENUM('rent', 'salaries', 'utilities', 'inventory', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES Organizations(id)
);

CREATE TABLE Salaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    branch_id INT NOT NULL,
    salary_month DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (branch_id) REFERENCES Branches(id)
);

CREATE TABLE Branch_Inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT DEFAULT 10,
    cost_per_unit DECIMAL(10,2) NOT NULL, -- Last purchase cost per unit (optional)
    last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (branch_id) REFERENCES Branches(id)
);

CREATE TABLE Inventory_Orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity_ordered INT NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_ordered * cost_per_unit) STORED,
    supplier VARCHAR(255),
    receipt_file_path VARCHAR(500), -- File location (cloud URL if uploaded to S3, GDrive, etc.)
    ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INT NOT NULL, -- Link to receptionist/branch admin who received it
    FOREIGN KEY (branch_id) REFERENCES Branches(id),
    FOREIGN KEY (received_by) REFERENCES Users(id)
);


CREATE TABLE Logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    branch_id INT NOT NULL,
    organization_id INT NOT NULL,
    activity TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (branch_id) REFERENCES Branches(id),
    FOREIGN KEY (organization_id) REFERENCES Organizations(id)
);

-- Organizations
CREATE INDEX idx_org_name ON Organizations(name);

-- Patients
CREATE INDEX idx_patient_phone ON Patients(contact_number);
CREATE INDEX idx_patient_dob ON Patients(date_of_birth);

-- Appointments
CREATE INDEX idx_appointment_date ON Appointments(appointment_date);

