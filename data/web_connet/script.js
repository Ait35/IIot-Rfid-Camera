
document.addEventListener("DOMContentLoaded", () => {
    console.log("5555555555555")
    checkStatus();
    // pollIp();
    document.getElementById('btn-scan').addEventListener('click', scanNetworks);
    document.getElementById('btn-connect').addEventListener('click', connectWifi);
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-submit').addEventListener('click', connectBackend);
    document.getElementById('btn-reApi').addEventListener('click', resetKey_Api);
});



// 1. เช็คสถานะตอนโหลดหน้าเว็บว่ามีค่าใน EEPROM หรือเชื่อมต่ออยู่แล้วหรือไม่
function checkStatus() {
    // สมมติว่าฝั่ง ESP32 มี Endpoint /status ที่ส่ง JSON กลับมา { "connected": true, "ssid": "MyWiFi" }
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            if (data.connected || data.hasSavedCredentials) {
                document.getElementById('logout-section').classList.remove('hidden');
                document.getElementById('current-ssid').innerText = data.ssid || "Saved Network";
            } else {
                document.getElementById('setup-section').classList.remove('hidden');
                scanNetworks(); // ถ้ายังไม่เคยเชื่อมต่อ ให้เริ่มแสกนเลย
            }
        })
        .catch(err => {
            console.error("Error checking status:", err);
            // Fallback: แสดงหน้า Setup
            document.getElementById('setup-section').classList.remove('hidden');
        });
}

// 2. แสกนหา WiFi
function scanNetworks() {
    const list = document.getElementById('network-list');
    list.innerHTML = '<li>Scanning networks... Please wait.</li>';
    
    // ฝั่ง ESP32 ต้องมี Endpoint /scan ส่ง JSON กลับมาเช่น ["WiFi_1", "WiFi_2"]
    fetch('/scan')
        .then(response => response.json())
        .then(networks => {
            list.innerHTML = '';
            networks.forEach(ssid => {
                let li = document.createElement('li');
                li.innerText = ssid;
                li.addEventListener('click', function() {
                    // ลบไฮไลต์ตัวเก่าออก
                    document.querySelectorAll('#network-list li').forEach(el => el.classList.remove('selected'));
                    // เพิ่มไฮไลต์ตัวที่ถูกคลิก
                    this.classList.add('selected');
                    // ใส่ชื่อ SSID ลงใน Input form
                    document.getElementById('ssid').value = this.innerText;
                });
                list.appendChild(li);
            });
        })
        .catch(err => {
            list.innerHTML = '<li>Error scanning networks.</li>';
        });
}

function pollIp() {
    console.log("Call get api");
    fetch('/is_connected')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.ip) {
                console.log("go to " + data.ip);
                location.replace("http://" + data.ip) 
            } else {
                console.log("not data");
                setTimeout(pollIp, 1000);
            }
            
        })
}


// 3. ส่งค่าเพื่อเชื่อมต่อ
function connectWifi() {
    const ssid = document.getElementById('ssid').value;
    const password = document.getElementById('password').value;
    const statusText = document.getElementById('connect-status');

    if(!ssid) {
        alert("Please select a network first!");
        return;
    }

    statusText.innerText = "Connecting and saving to EEPROM/Preferences...";
    statusText.style.color = "blue";

    // ส่งข้อมูลไปให้ ESP32 ผ่าน POST Request
    // แนะนำให้อ่าน Request Body ฝั่ง C++ แล้วบันทึกลง Preferences (แทน EEPROM แบบเก่า)
    fetch('/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(password)}`
    })
    .then(response => {
        if(response.ok) {
            statusText.innerText = "Success! ESP32 is connecting/rebooting.";
            statusText.style.color = "green";
            setTimeout(() => {pollIp(); }, 7000);
        } else {
            statusText.innerText = "Failed to send credentials.";
            statusText.style.color = "red";
        }
    });
}

function connectBackend() {
    const key_api = document.getElementById('key_api').value;
    const statusText = document.getElementById('connecKeytApi-status')

    if(!key_api) {
        alert("Please input key api!");
        return;
    }

    statusText.innerText = "Connecting to server...";
    statusText.style.color = "blue";

    fetch('/connectSever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `key_api=${encodeURIComponent(key_api)}`
    })
    .then(response => {
        if(response.ok) {
            statusText.innerText = "Success! server is connecting";
            statusText.style.color = "green";
            // อาจจะหน่วงเวลาแล้วโหลดหน้าใหม่
            console.log("reload connectBackend");
            setTimeout(() => location.reload(), 3000);
        } else {
            statusText.innerText = "Failed to send Key_API.";
            statusText.style.color = "red";
        }
    });
}

function resetKey_Api(){
     fetch('/resetKey_Api', { method: 'POST' })
            .then(() => {
                alert("key Api cleared. Please reconnect to the Server.");
                location.reload();
            });   
}

// 4. ลบข้อมูลออก (Logout)
function logout() {
    if(confirm("Are you sure you want to clear saved WiFi credentials?")) {
        // ฝั่ง ESP32 เมื่อรับ /logout ให้ทำการลบค่าใน EEPROM/Preferences แล้วสั่ง ESP.restart()
        fetch('/logout', { method: 'POST' })
            .then(() => {
                alert("Credentials cleared. Please reconnect to the AP.");
                console.log("reload logout");
                location.reload();
            });
    }
}