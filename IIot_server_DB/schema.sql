DROP TABLE IF EXISTS Activity_Log CASCADE;
DROP TABLE IF EXISTS Log_Images CASCADE;
DROP TABLE IF EXISTS Log_Rfid CASCADE;
DROP TABLE IF EXISTS MQTT CASCADE;
DROP TABLE IF EXISTS Map_tag CASCADE;
DROP TABLE IF EXISTS IP_camera CASCADE;
DROP TABLE IF EXISTS Device_info CASCADE;
DROP TABLE IF EXISTS Device_Group CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

CREATE TABLE Users (
    User_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    first_name    VARCHAR(255) NOT NULL,
    last_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20) DEFAULT 'student',
    created_at    TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0), 
    last_login_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    is_delete     BOOLEAN DEFAULT FALSE,       
    token         VARCHAR(255) UNIQUE
);

CREATE TABLE Device_Group (
    Group_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Group_name   VARCHAR(50) NOT NULL UNIQUE,  -- ชื่อกลุ่ม เช่น 'DOOR_1'
    By_user_id   INT NOT NULL,
    created_at   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    is_delete     BOOLEAN DEFAULT FALSE, 

    CONSTRAINT fk_group_user
        FOREIGN KEY (By_user_id)
        REFERENCES Users(User_id)
);

CREATE TABLE Device_info (
    Device_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Device_name  VARCHAR(100),
    device_type  VARCHAR(20) NOT NULL,       -- 'RFID' หรือ 'CAM'
    Group_id     INT NOT NULL,              
    By_user_id   INT ,
    mac          VARCHAR(17) NOT NULL UNIQUE,
    IP           VARCHAR(45) NOT NULL,
    subnet       VARCHAR(45) NOT NULL,
    gate_way     VARCHAR(45) NOT NULL,
    last_active_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    HW_uptime    INT NOT NULL DEFAULT 0,
    Local        VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0), 
    is_delete    BOOLEAN DEFAULT FALSE, 
    status       BOOLEAN DEFAULT FALSE,
    key_api      VARCHAR(255) NOT NULL UNIQUE,

    CONSTRAINT fk_device_group
        FOREIGN KEY (Group_id)
        REFERENCES Device_Group(Group_id) ON DELETE CASCADE,

    CONSTRAINT fk_device_user
        FOREIGN KEY (By_user_id)
        REFERENCES Users(User_id)
);

CREATE TABLE IP_camera (
    IP_cam_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cam_name     VARCHAR(100) NOT NULL,      
    mac          VARCHAR(17) NOT NULL UNIQUE,
    Group_id     INT NOT NULL,               
    By_user_id   INT NOT NULL,
    ip           VARCHAR(45) NOT NULL, 
    ONVIF_url    VARCHAR(255),              
    rtsp_url     VARCHAR(255),               -- สตรีมสด เช่น 'rtsp://admin:123456@192.168.1.50:554/stream1'
    snapshot_url VARCHAR(255),               -- ถ่ายภาพนิ่ง เช่น 'http://192.168.1.50/cgi-bin/snapshot.cgi'
    cam_username VARCHAR(100),
    cam_password VARCHAR(100),
    keep_alive_port INT,
    auth         VARCHAR(100) DEFAULT query, 
    local        VARCHAR(255),               
    status       BOOLEAN DEFAULT FALSE,     
    up_time      INT NOT NULL DEFAULT 0,     
    last_active_at TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    created_at   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    is_delete    BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_ip_cam_group
        FOREIGN KEY (Group_id)
        REFERENCES Device_Group(Group_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_ip_cam_user
        FOREIGN KEY (By_user_id)
        REFERENCES Users(User_id)
);

CREATE INDEX idx_ip_cam_group ON IP_camera(Group_id);


CREATE TABLE MQTT (
    Mqtt_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    By_user_id   INT NOT NULL ,
    Group_id     INT NOT NULL UNIQUE,      
    Topic        VARCHAR(255),               -- เช่น 'mqtt/DOOR_1'
    User_Mqtt    VARCHAR(255),
    Pass_Mqtt    VARCHAR(255),
    created_at   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    is_delete    BOOLEAN DEFAULT FALSE,       

    CONSTRAINT fk_mqtt_group
        FOREIGN KEY (Group_id)
        REFERENCES Device_Group(Group_id) ON DELETE CASCADE,

    CONSTRAINT fk_mqtt_user
        FOREIGN KEY (By_user_id)
        REFERENCES Users(User_id)
);

CREATE TABLE Map_tag (
    EPC_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    EPC          VARCHAR(255) NOT NULL UNIQUE,
    Tag          VARCHAR(255),
    By_user_id   INT,                            -- เอา NOT NULL ออก เพื่อรองรับ Tag แปลกหน้าที่ยังไม่มีคน Assign
    status       VARCHAR(20) DEFAULT 'pending',  -- เพิ่ม: 'pending', 'active', 'stolen'
    created_at   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),
    is_delete    BOOLEAN DEFAULT FALSE,        

    CONSTRAINT fk_maptag_user
        FOREIGN KEY (By_user_id)
        REFERENCES Users(User_id)
);

CREATE TABLE Log_Rfid (
    Log_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Device_id    INT NOT NULL,
    EPC_id       INT NOT NULL,
    distance     DOUBLE PRECISION,
    time_stamp   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0), 

    CONSTRAINT fk_log_device
        FOREIGN KEY (Device_id)
        REFERENCES Device_info(Device_id),

    CONSTRAINT fk_log_epc
        FOREIGN KEY (EPC_id)
        REFERENCES Map_tag(EPC_id)
);

CREATE TABLE Log_Images (
    Image_id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Log_id           INT NOT NULL,               
    IP_cam_id        INT,
    MCU_cam_id       INT,     
    image_path       VARCHAR(500) NOT NULL,     
    created_at       TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0),

    CONSTRAINT fk_image_log
        FOREIGN KEY (Log_id)
        REFERENCES Log_Rfid(Log_id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_image_IP_camera
        FOREIGN KEY (IP_cam_id)
        REFERENCES IP_camera(IP_cam_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_image_MCU_camera
        FOREIGN KEY (MCU_cam_id)
        REFERENCES Device_info(Device_id)
        ON DELETE CASCADE,

    CONSTRAINT check_cam_id 
        CHECK(num_nonnulls(IP_cam_id, MCU_cam_id) = 1)
);

CREATE TABLE Activity_Log (
    Activity_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id       INT,                                 
    action_type   VARCHAR(100) NOT NULL,      
    target_table  VARCHAR(100),    
    target_id     INT,
    payload       JSONB,                          
    time_action   TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP(0), 

    CONSTRAINT fk_activity_user
        FOREIGN KEY (User_id)
        REFERENCES Users(User_id) 
        ON DELETE SET NULL  
);

CREATE INDEX idx_activity_payload ON Activity_Log USING GIN (payload jsonb_path_ops);
CREATE INDEX idx_activity_time ON Activity_Log(time_action DESC);
