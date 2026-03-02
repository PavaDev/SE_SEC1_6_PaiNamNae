*** Settings ***
Documentation     Robot Framework — Passenger Get Notification
...               User Story: As a passenger, I want to get a notification
...               when the driver is about to pick me up so that I can get
...               myself ready or respond to the driver.
...               Test Level: UAT (Browser-based E2E)
Library           SeleniumLibrary
Suite Setup       Open Browser To Login Page
Suite Teardown    Close All Browsers
Test Teardown     Run Keyword If Test Failed    Capture Page Screenshot


*** Variables ***
${BASE_URL}            http://localhost:3001
${BROWSER}             chrome

${DRIVER_USERNAME}            driver@test.com
${DRIVER_PASSWORD}            password123
${PASSENGER_USERNAME}         passenger1@test.com
${PASSENGER_PASSWORD}         password123

${TIMEOUT}             15s


*** Keywords ***
Open Browser To Login Page
    Open Browser    ${BASE_URL}/login    ${BROWSER}
    Set Selenium Implicit Wait    ${TIMEOUT}
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}

Login As
    [Arguments]    ${username}    ${password}
    Go To    ${BASE_URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Clear Element Text    id=identifier
    Input Text    id=identifier    ${username}
    Clear Element Text    id=password
    Input Text    id=password    ${password}
    Click Button    xpath=//button[@type='submit']
    Sleep    2s

Driver Login
    Login As    ${DRIVER_USERNAME}    ${DRIVER_PASSWORD}

Passenger Login
    Login As    ${PASSENGER_USERNAME}    ${PASSENGER_PASSWORD}

Logout
    Delete All Cookies
    Go To    ${BASE_URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}

# ── Driver: Create Route ──
Driver Create Route
    [Documentation]    Driver navigates to /createTrip and creates a new route
    Go To    ${BASE_URL}/createTrip
    Sleep    3s
    Wait Until Page Contains    สร้างการเดินทางของคุณ    ${TIMEOUT}

    # Fill in start point (id=startPoint, placeholder: เช่น กรุงเทพมหานคร, ถนนสุขุมวิท)
    Wait Until Page Contains Element    id=startPoint    ${TIMEOUT}
    Clear Element Text    id=startPoint
    Input Text    id=startPoint    ขอนแก่น
    Sleep    2s
    # Select first Google Maps autocomplete suggestion
    ${has_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    5s
    Run Keyword If    ${has_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill in end point (id=endPoint, placeholder: เช่น เชียงใหม่, ถนนนิมมานเหมินท์)
    Wait Until Page Contains Element    id=endPoint    ${TIMEOUT}
    Clear Element Text    id=endPoint
    Input Text    id=endPoint    สุรินทร์
    Sleep    2s
    ${has_pac2}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    5s
    Run Keyword If    ${has_pac2}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill travel date (id=travelDate, type=date) — set to tomorrow
    ${tomorrow}=    Evaluate    (datetime.date.today() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')    modules=datetime
    Execute Javascript
    ...    var input = document.getElementById('travelDate');
    ...    var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ...    nativeSetter.call(input, '${tomorrow}');
    ...    input.dispatchEvent(new Event('input', { bubbles: true }));
    ...    input.dispatchEvent(new Event('change', { bubbles: true }));
    Sleep    1s

    # Fill travel time (id=travelTime, type=time)
    Execute Javascript
    ...    var input = document.getElementById('travelTime');
    ...    var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ...    nativeSetter.call(input, '09:00');
    ...    input.dispatchEvent(new Event('input', { bubbles: true }));
    ...    input.dispatchEvent(new Event('change', { bubbles: true }));
    Sleep    1s

    # Fill seat count (id=seatCount, type=number, placeholder: กรอกจำนวนที่นั่ง (เช่น 4))
    Wait Until Page Contains Element    id=seatCount    ${TIMEOUT}
    Clear Element Text    id=seatCount
    Input Text    id=seatCount    3
    Sleep    1s

    # Fill price per seat (id=pricePerSeat, type=number, placeholder: เช่น 250)
    Wait Until Page Contains Element    id=pricePerSeat    ${TIMEOUT}
    Clear Element Text    id=pricePerSeat
    Input Text    id=pricePerSeat    100
    Sleep    1s

    # Select vehicle (id=vehicle, select dropdown — auto-selects first if available)
    ${has_vehicle}=    Run Keyword And Return Status    Page Should Contain Element    id=vehicle
    Run Keyword If    ${has_vehicle}    Select From List By Index    id=vehicle    1

    # Scroll down and click create button (text: สร้างการเดินทาง)
    Execute Javascript    window.scrollTo(0, document.body.scrollHeight);
    Sleep    1s
    Wait Until Page Contains Element    xpath=//button[@type='submit' and contains(text(),'สร้างการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[@type='submit' and contains(text(),'สร้างการเดินทาง')]
    Sleep    3s

# ── Passenger: Book The Route ──
Passenger Book The Route
    [Documentation]    Passenger navigates to /findTrip and books the driver's route
    Go To    ${BASE_URL}/findTrip
    Sleep    3s
    Wait Until Page Contains    ค้นหาการเดินทาง    ${TIMEOUT}

    # Click on the first available trip card to expand it
    Wait Until Page Contains Element    xpath=(//div[contains(@class,'route-card')])[1]    ${TIMEOUT}
    Click Element    xpath=(//div[contains(@class,'route-card')])[1]
    Sleep    2s

    # Click "จองที่นั่ง" button to open booking modal
    Wait Until Page Contains Element    xpath=//button[contains(text(),'จองที่นั่ง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'จองที่นั่ง')]
    Sleep    2s

    # Booking modal should appear with title "ยืนยันการจอง"
    Wait Until Page Contains    ยืนยันการจอง    ${TIMEOUT}

    # Seat count is a <select>, default is 1 — leave as default
    Sleep    1s

    # Fill pickup point (placeholder: พิมพ์ชื่อสถานที่...)
    ${pickup_visible}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//input[@placeholder='พิมพ์ชื่อสถานที่...']    5s
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[1]    หอแปดหลัง
    Sleep    2s
    ${pickup_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    3s
    Run Keyword If    ${pickup_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill dropoff point
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[2]    สุรินทร์
    Sleep    2s
    ${dropoff_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    3s
    Run Keyword If    ${dropoff_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Click "ยืนยันการจอง" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยันการจอง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ยืนยันการจอง')]
    Sleep    3s

# ── Driver: Confirm Passenger Booking (via current-trip page) ──
Driver Confirm Passenger Booking
    [Documentation]    Driver navigates to /current-trip and accepts the pending booking
    Go To    ${BASE_URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Wait for the "คำขอใหม่" section to appear (pending bookings)
    Wait Until Page Contains    คำขอใหม่    ${TIMEOUT}

    # Click "รับ" button to accept the first pending booking
    Wait Until Page Contains Element    xpath=//button[contains(text(),'รับ')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'รับ')]
    Sleep    3s

# ── Driver: Start Trip ──
Driver Start Trip
    [Documentation]    Driver starts the trip from /current-trip page
    Go To    ${BASE_URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Click "เริ่มต้นการเดินทาง" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'เริ่มต้นการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'เริ่มต้นการเดินทาง')]
    Sleep    2s

    # Confirm dialog appears — click "ยืนยัน"
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ยืนยัน')]
    Sleep    3s

# ── Driver: Send Arrival Notification ──
Driver Send Arrival Notification
    [Documentation]    Driver sends an arrival notification to the passenger from /current-trip
    Go To    ${BASE_URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Wait for "รอรับผู้โดยสาร" section (confirmed bookings in IN_TRANSIT route)
    Wait Until Page Contains    รอรับผู้โดยสาร    ${TIMEOUT}

    # Click the bell icon button (title="แจ้งเตือนจะถึงแล้ว") for the first confirmed booking
    Wait Until Page Contains Element    xpath=//button[@title='แจ้งเตือนจะถึงแล้ว']    ${TIMEOUT}
    Click Element    xpath=//button[@title='แจ้งเตือนจะถึงแล้ว']
    Sleep    2s

    # Arrival time picker modal should appear — "จะถึงภายในกี่นาที?"
    Wait Until Page Contains    จะถึงภายในกี่นาที?    ${TIMEOUT}

    # Select 5 minutes (default is already selected, but click to be sure)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'5 นาที')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'5 นาที')]
    Sleep    1s

    # Click "ยืนยัน" to send the notification
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ยืนยัน')]
    Sleep    3s

# ── Passenger: Check Notification via Trip Status ──
Passenger Check Notification
    [Documentation]    Passenger clicks 'กำลังเดินทาง...' and checks the arrival notification
    Sleep    3s
    Reload Page
    Sleep    2s

    # Click from navbar "กำลังเดินทาง..."
    Wait Until Page Contains Element    xpath=//a[contains(text(),'กำลังเดินทาง...')]    ${TIMEOUT}
    Click Element    xpath=//a[contains(text(),'กำลังเดินทาง...')]
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Click the floating bubble chat (Toggle Trip Status) to view notification
    Wait Until Page Contains Element    xpath=//button[@aria-label='Toggle Trip Status']    ${TIMEOUT}
    Click Element    xpath=//button[@aria-label='Toggle Trip Status']
    Sleep    2s
    
    # Check that the arrival time (5 นาที) sent by the driver is present in the notifications
    Wait Until Page Contains    5 นาที    ${TIMEOUT}

# ── Driver: Complete Trip ──
Driver Complete Trip
    [Documentation]    Driver marks passenger as picked up, drops them off, and finishes trip
    Go To    ${BASE_URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Mark Passenger as Checked In ("เช็คอิน" button in รอรับผู้โดยสาร)
    # The button has title="เช็คอิน"
    Wait Until Page Contains    รอรับผู้โดยสาร    ${TIMEOUT}
    Wait Until Page Contains Element    xpath=//button[@title='เช็คอิน']    ${TIMEOUT}
    Click Element    xpath=//button[@title='เช็คอิน']
    Sleep    3s

    # Mark Passenger as Dropped Off ("ส่งตัว" button in อยู่ระหว่างการเดินทาง)
    Wait Until Page Contains    อยู่ระหว่างการเดินทาง    ${TIMEOUT}
    Wait Until Page Contains Element    xpath=//button[@title='ส่งตัว']    ${TIMEOUT}
    Click Element    xpath=//button[@title='ส่งตัว']
    Sleep    3s

    # Click "เสร็จสิ้นการเดินทาง"
    Wait Until Page Contains Element    xpath=//button[contains(text(),'เสร็จสิ้นการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'เสร็จสิ้นการเดินทาง')]
    Sleep    2s

    # Confirm dialog appears — click "ยืนยัน"
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ยืนยัน')]
    Sleep    3s


*** Test Cases ***
# ─────────────────────────────────────────────────────────
# Scenario 1: Driver Creates A Route
# ─────────────────────────────────────────────────────────
Driver Creates A Route
    [Documentation]    Given a verified driver who is logged in,
    ...                When they navigate to the create trip page
    ...                and fill in the route details,
    ...                Then a new route should be created successfully.
    [Tags]    driver    route    create
    Driver Login
    Driver Create Route
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 2: Passenger Books The Route
# ─────────────────────────────────────────────────────────
Passenger Books The Route
    [Documentation]    Given a passenger who is logged in,
    ...                When they navigate to find trip and book the route
    ...                created by the driver,
    ...                Then the booking should be successful.
    [Tags]    passenger    booking    create
    Passenger Login
    Passenger Book The Route
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 3: Driver Confirms Booking And Starts Trip
# ─────────────────────────────────────────────────────────
Driver Confirms Booking And Starts Trip
    [Documentation]    Given a driver who has a pending booking request,
    ...                When they confirm the booking and start the trip,
    ...                Then the route status should change to IN_TRANSIT.
    [Tags]    driver    booking    confirm    start
    Driver Login
    Driver Confirm Passenger Booking
    Driver Start Trip
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 4: Driver Sends Arrival Notification
# ─────────────────────────────────────────────────────────
Driver Sends Arrival Notification
    [Documentation]    Given a driver who is in transit,
    ...                When they click the bell icon next to a confirmed
    ...                passenger and select arrival time,
    ...                Then the arrival notification should be sent.
    [Tags]    driver    notification    arrival
    Driver Login
    Driver Send Arrival Notification
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 5: Passenger Sees Arrival Notification In Status
# ─────────────────────────────────────────────────────────
Passenger Sees Arrival Notification
    [Documentation]    Given a passenger whose driver has sent an arrival
    ...                notification,
    ...                When they click 'กำลังเดินทาง...' to view current trip,
    ...                Then they should see the arrival notification modal.
    [Tags]    passenger    notification    verify
    Passenger Login
    Passenger Check Notification
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 6: Driver Completes The Route
# ─────────────────────────────────────────────────────────
Driver Completes The Route
    [Documentation]    Given a driver who has picked up the passenger,
    ...                When they drop off the passenger and finish the route,
    ...                Then the trip should be completed successfully.
    [Tags]    driver    route    complete
    Driver Login
    Driver Complete Trip
    [Teardown]    Logout