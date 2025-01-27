// HTML-контент
const char htmlPage[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Wake on LAN</title>
    <link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css">
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'>
    <script src='https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js'></script>
    <script>
        $(document).ready(function() {
            updatePCList();
        });
        function updatePCList() {
            fetch('/pc_list').then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }).then(data => {
                if (!Array.isArray(data)) {
                    console.error('Expected an array but got:', data);
                    return;
                }
                const pcList = document.getElementById('pc-list');
                pcList.innerHTML = '';
                data.forEach((pc, index) => {
                    pcList.innerHTML += '<li class="list-group-item d-flex justify-content-between align-items-center">' +
                        '<div class="status-circle" id="status-' + index + '"></div>' +
                        pc.name + ' - ' + pc.mac + ' - ' + pc.ip +
                        '<div class="ml-auto">' +
                        '<button id="ping-button-'+ index +'" class="btn btn-info btn-md mr-2" onclick="pingPC(\'' + pc.ip + '\', ' + index + ')"><i class="fas fa-table-tennis"></i></button>' +
                        '<button class="btn btn-warning btn-md mr-2" onclick="editPC(' + index + ')"><i class="fas fa-edit"></i></button>' +
                        '<button class="btn btn-primary btn-md" onclick="wakePC(\'' + pc.mac + '\')"><i class="fas fa-play"></i></button>' +
                        '</div></li>';
                });
            }).catch(error => {
                console.error('Fetch error:', error);
            });
        }
        function addPC() {
            const name = document.getElementById('pc-name').value;
            const mac = document.getElementById('pc-mac').value;
            const ip = document.getElementById('pc-ip').value;
            fetch('/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mac, ip })
            }).then(response => {
                if (response.ok) {
                    updatePCList();
                    $('#add-pc-modal').modal('hide');
                    document.getElementById('pc-name').value = '';
                    document.getElementById('pc-mac').value = '';
                    document.getElementById('pc-ip').value = '';
                    showNotification('PC added successfully!', 'success');
                }
            });
        }
        function editPC(index) {
            fetch('/pc_list').then(response => response.json()).then(data => {
                const pc = data[index];
                document.getElementById('edit-pc-name').value = pc.name;
                document.getElementById('edit-pc-mac').value = pc.mac;
                document.getElementById('edit-pc-ip').value = pc.ip;
                $('#edit-pc-modal').data('index', index).modal('show');
            });
        }
        function saveEditPC() {
            const index = $('#edit-pc-modal').data('index');
            const name = document.getElementById('edit-pc-name').value;
            const mac = document.getElementById('edit-pc-mac').value;
            const ip = document.getElementById('edit-pc-ip').value;
            fetch('/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index, name, mac, ip })
            }).then(response => {
                if (response.ok) {
                    updatePCList();
                    $('#edit-pc-modal').modal('hide');
                    showNotification('PC updated successfully!', 'success');
                }
            });
        }
        function confirmDelete() {
            const index = $('#edit-pc-modal').data('index');
            fetch('/delete?index=' + index, { method: 'POST' }).then(response => {
                if (response.ok) {
                    updatePCList();
                    showNotification('PC deleted successfully!', 'danger');
                }
            });
            $('#edit-pc-modal').modal('hide');
        }
        function wakePC(mac) {
            fetch('/wake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mac })
            }).then(response => {
                if (response.ok) {
                    showNotification('WOL packet sent to ' + mac, 'info');
                }
            });
        }

        function pingPC(ip, index) {
            const button = document.getElementById('ping-button-' + index);
            button.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>';
            
            fetch('/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            }).then(response => {
                const statusCircle = document.getElementById('status-' + index);

                button.innerHTML = '<i class="fas fa-table-tennis"></i>';
            
                if (response.ok) {
                    statusCircle.classList.remove('red');
                    statusCircle.classList.add('green');
                    statusCircle.classList.add('blinking');
                    showNotification('Pinging', 'success');

                    setTimeout(() => {
                        statusCircle.classList.remove('blinking');
                        statusCircle.classList.remove('green');
                    }, 10000);
                } else {
                    statusCircle.classList.remove('green', 'blinking');
                    statusCircle.classList.add('red');
                    showNotification('Not pinging', 'danger');

                    setTimeout(() => {
                        statusCircle.classList.remove('red');
                    }, 10000);
                }
            }).catch(() => {
                const statusCircle = document.getElementById('status-' + index);
                statusCircle.classList.remove('green', 'blinking');
                statusCircle.classList.add('red');
                showNotification('Not pinging', 'danger');
            });
        }

        function showNotification(message, type) {
            const notification = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' + message + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
            $('#notification-area').append(notification);
            setTimeout(() => {
                notification.alert('close');
            }, 3000);
        }
        function resetWiFiSettings() {
            fetch('/reset_wifi', { method: 'POST' })
               .then(response => {
                    if (response.ok) {
                        showNotification('WiFi settings reset successfully!', 'success');
                        location.reload();
                    } else {
                        console.error('Failed to reset WiFi settings');
                        showNotification('Failed to reset WiFi settings.', 'danger');
                    }
                })
               .catch(error => console.error('Fetch error:', error));
        }
        function updateNetworkSettings() {
            const enable = document.getElementById('inlineRadioStaticIP').checked;
            const ip = document.getElementById('fieldIP').value;
            const networkMask = document.getElementById('fieldNetworkMask').value;
            const gateway = document.getElementById('fieldGateway').value;

            fetch('/update_network_settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable, ip, networkMask, gateway })
            })
            .then(response => {
                $('#settings-modal').modal('hide');
                if (response.ok) {
                    showNotification('Network settings updated successfully!', 'success');
                    location.replace(`http://${ip}`);
                } else {
                    showNotification('Failed to update settings.', 'danger');
                }
            })
            .catch(error => console.error('Fetch error:', error));
        }

        function updateAuthentication() {
            const enable = document.getElementById('switchEnableAuthentication').checked;
            const username = document.getElementById('fieldUsername').value;
            const password = document.getElementById('fieldPassword').value;

            fetch('/update_authentication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable, username, password })
            })
            .then(response => {
                $('#settings-modal').modal('hide');
                if (response.ok) {
                    showNotification('Authentication updated successfully!', 'success');
                    location.reload();
                } else {
                    showNotification('Failed to update authentication.', 'danger');
                }
            })
            .catch(error => console.error('Fetch error:', error));
        }
        
        function getNetworkSettings() {
            fetch('/network_settings')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('inlineRadioStaticIP').checked = data.enable;
                    document.getElementById('inlineRadioDHCP').checked = !data.enable;
                    document.getElementById('fieldIP').value = data.ip;
                    document.getElementById('fieldNetworkMask').value = data.networkMask;
                    document.getElementById('fieldGateway').value = data.gateway;

                    toggleNetworkFields();
                })
                .catch(error => console.error('Fetch error (Network Settings):', error));
        }

        function getAuthentication() {
            fetch('/authentication')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('switchEnableAuthentication').checked = data.enable;
                    document.getElementById('fieldUsername').value = data.username;
                    document.getElementById('fieldPassword').value = data.password;

                    toggleAuthenticationFields();
                })
                .catch(error => console.error('Fetch error (Authentication):', error));
        }

        function toggleAuthenticationFields() {
            const switchElement = document.getElementById('switchEnableAuthentication');
            const usernameField = document.getElementById('fieldUsername');
            const passwordField = document.getElementById('fieldPassword');
            
            if (switchElement.checked) {
                usernameField.removeAttribute('disabled');
                passwordField.removeAttribute('disabled');
            } else {
                usernameField.setAttribute('disabled', '');
                passwordField.setAttribute('disabled', '');
            }
        }

        function toggleNetworkFields() {
            const isStaticIP = document.getElementById('inlineRadioStaticIP').checked;
            const ipField = document.getElementById('fieldIP');
            const networkMaskField = document.getElementById('fieldNetworkMask');
            const gatewayField = document.getElementById('fieldGateway');

            if (isStaticIP) {
                ipField.removeAttribute('disabled');
                networkMaskField.removeAttribute('disabled');
                gatewayField.removeAttribute('disabled');
            } else {
                ipField.setAttribute('disabled', '');
                networkMaskField.setAttribute('disabled', '');
                gatewayField.setAttribute('disabled', '');
            }
        }

        function getAbout() {
            fetch('/about')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('version').innerText = data.version;
                    document.getElementById('hostname').innerText = data.hostname;

                })
                .catch(error => console.error('Fetch error (About):', error));
        }
    </script>
    <style>
        .status-circle {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background-color: gray;
            margin-right: 10px;
            transition: background-color 0.3s ease;
        }

        .blinking {
            animation: blink-animation 1s infinite;
        }

        @keyframes blink-animation {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
        }

        .status-circle.green {
            background-color: green;
        }

        .status-circle.red {
            background-color: red;
        }
    </style>
</head>
<body class='bg-light text-dark'>
    <div class='container mt-5'>
        <h1 class='text-center'>Wake on LAN</h1>
        <div id='notification-area'></div>
        <h2 class='mt-4 d-flex justify-content-between align-items-center'>
            <span>PC List</span>
            <div class='ml-auto'>
                <button class='btn btn-success' data-toggle='modal' data-target='#add-pc-modal'>
                    <i class='fas fa-plus'></i>
                </button>
                <button class='btn btn-secondary btn-md' title='Settings' data-toggle='modal' data-target='#settings-modal' onclick="getNetworkSettings(); getAuthentication(); getAbout();">
                    <i class='fas fa-cog'></i>
                </button>
            </div>
        </h2>
        <ul id='pc-list' class='list-group mt-3'></ul>
    </div>
    <div class='modal fade' id='add-pc-modal' tabindex='-1' role='dialog' aria-labelledby='addPCLabel' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title' id='addPCLabel'>Add PC</h5>
                    <button type='button' class='close' data-dismiss='modal' aria-label='Close'>
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>
                <div class='modal-body'>
                    <div class='form-group'>
                        <label for='pc-name'>Name</label>
                        <input type='text' class='form-control' id='pc-name' placeholder='Enter PC name'>
                    </div>
                    <div class='form-group'>
                        <label for='pc-mac'>MAC Address</label>
                        <input type='text' class='form-control' id='pc-mac' placeholder='Enter MAC address'>
                    </div>
                    <div class='form-group'>
                        <label for='pc-ip'>IP Address</label>
                        <input type='text' class='form-control' id='pc-ip' placeholder='Enter IP address'>
                    </div>
                </div>
                <div class='modal-footer'>
                    <button type='button' class='btn btn-primary' onclick='addPC()'>Add</button>
                    <button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>
                </div>
            </div>
        </div>
    </div>
    <div class='modal fade' id='edit-pc-modal' tabindex='-1' role='dialog' aria-labelledby='editPCLabel' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title' id='editPCLabel'>Edit PC</h5>
                    <button type='button' class='close' data-dismiss='modal' aria-label='Close'>
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>
                <div class='modal-body'>
                    <div class='form-group'>
                        <label for='edit-pc-name'>Name</label>
                        <input type='text' class='form-control' id='edit-pc-name' placeholder='Enter PC name'>
                    </div>
                    <div class='form-group'>
                        <label for='edit-pc-mac'>MAC Address</label>
                        <input type='text' class='form-control' id='edit-pc-mac' placeholder='Enter MAC address'>
                    </div>
                    <div class='form-group'>
                        <label for='edit-pc-ip'>IP Address</label>
                        <input type='text' class='form-control' id='edit-pc-ip' placeholder='Enter IP address'>
                    </div>
                </div>
                <div class='modal-footer'>
                    <button type='button' class='btn btn-primary' onclick='saveEditPC()'>Save changes</button>
                    <button type='button' class='btn btn-danger' onclick='confirmDelete()'>Delete</button>
                    <button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>
                </div>
            </div>
        </div>
    </div>
    <div class='modal fade' id='settings-modal' tabindex='-1' role='dialog' aria-labelledby='settingsLabel' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title' id='settingsLabel'>Settings</h5>
                    <button type='button' class='close' data-dismiss='modal' aria-label='Close'>
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>
                <div class='modal-body'>
                    <div class='card'>
                        <div class='card-header'>
                            <h5 class='modal-title'>About</h5>
                        </div>
                        <div class='card-body'>
                            <p class="card-text"> Version: 
                                <a id="version" href="https://github.com/StafLoker/EspWOL" class="badge badge-pill badge-success"></a>
                            </p>
                            <p class="card-text"> Hostname: 
                                <span id="hostname" class="badge badge-info"></span>
                            </p>
                        </div>
                    </div>
                    <hr/>
                    <div class='card'>
                        <div class='card-header'>
                            <h5 class='modal-title'>Network</h5>
                        </div>
                        <div class='card-body'>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadioStaticIP" value="staticIP" onchange="toggleNetworkFields()"> 
                                <label class="form-check-label" for="inlineRadio1">Static IP</label>
                              </div>
                              <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadioDHCP" value="dhcp" onchange="toggleNetworkFields()">
                                <label class="form-check-label" for="inlineRadio2">DHCP</label>
                            </div>
                            <div class='form-group'>
                                <label for='ip'>IP:</label>
                                <input type='text' class='form-control' id='fieldIP' placeholder='192.168.2.9'>
                            </div>
                            <div class='form-group'>
                                <label for='static-network-mask'>Network Mask:</label>
                                <input type='text' class='form-control' id='fieldNetworkMask' placeholder='255.255.255.0'>
                            </div>
                            <div class='form-group'>
                                <label for='static-gateway'>Gateway:</label>
                                <input type='text' class='form-control' id='fieldGateway' placeholder='192.168.2.1'>
                            </div>
                        </div>
                        <div class='card-footer'>
                            <button type='button' class='btn btn-primary' onclick='updateNetworkSettings()'>Update</button>
                            <button type='button' class='btn btn-danger' title='Reset WiFi' data-toggle='modal' data-target='#reset-wifi-modal'onclick="$('#settings-modal').modal('hide');">Reset WiFi</button>
                        </div>
                    </div>
                    <hr/>
                    <div class='card'>
                        <div class='card-header'>
                            <h5 class='modal-title'>Authentication</h5>
                        </div>
                        <div class='card-body'>
                            <div class="custom-control custom-switch">
                              <input type="checkbox" class="custom-control-input" id="switchEnableAuthentication" onchange="toggleAuthenticationFields()">
                              <label class="custom-control-label" for="switchEnableAuthentication">Enable</label>
                            </div>
                            <div class='form-group'>
                                <label for='username'>Username:</label>
                                <input type='text' class='form-control' id='fieldUsername' placeholder='Enter username'>
                            </div>
                            <div class='form-group'>
                                <label for='password'>Password:</label>
                                <input type='password' class='form-control' id='fieldPassword' placeholder='Enter password'>
                            </div>
                        </div>
                        <div class='card-footer'>
                            <button type='button' class='btn btn-primary' onclick='updateAuthentication()'>Update</button>
                        </div>
                    </div>
                </div>
                <div class='modal-footer'>
                    <button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>
                </div>
            </div>
        </div>
    </div>
    <div class='modal fade' id='reset-wifi-modal' tabindex='-1' role='dialog' aria-labelledby='resetWiFiLabel' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title' id='resetWiFiLabel'>Reset WiFi Settings</h5>
                    <button type='button' class='close' data-dismiss='modal' aria-label='Close'>
                        <span aria-hidden='true'>&times;</span>
                    </button>
                </div>
                <div class='modal-body'>
                    <p>Are you sure you want to reset WiFi settings? This will clear saved credentials.</p>
                </div>
                <div class='modal-footer'>
                    <button type='button' class='btn btn-danger' onclick='resetWiFiSettings()'>Reset</button>
                    <button type='button' class='btn btn-secondary' data-dismiss='modal' onclick="$('#settings-modal').modal('show');">Cancel</button>
                </div>
            </div>
        </div>
    </div>
    <footer class='text-center mt-5'>
        <p>&copy; 2025 StafLoker</p>
    </footer>
</body>
</html>
)rawliteral";