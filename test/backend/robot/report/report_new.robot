*** Settings ***
Library           SeleniumLibrary
Library           Collections
Library           OperatingSystem
Suite Setup       Open Browser To Login Page
Suite Teardown    Close All Browsers

*** Variables ***
${URL}                http://localhost:3001
${URL_REPORTS}        http://localhost:3001/profile/reports
${BROWSER}            Chrome

# ─────────────────────────────────────────────────────────
# --- Test Data: Driver ---
# ─────────────────────────────────────────────────────────
${DRIVER_EMAIL}     driver@test.com
${DRIVER_PASS}      password123
${START_LOC}        ขอนแก่น
${END_LOC}          สุรินทร์
${TRIP_TIME}        09:00
${SEATS}            4
${PRICE}            120

# ─────────────────────────────────────────────────────────
# --- Test Data: Passenger ---
# ─────────────────────────────────────────────────────────
${PASSENGER_EMAIL}     passenger1@test.com
${PASSENGER_PASS}      password123

# ─────────────────────────────────────────────────────────
# --- Test Data: Files ---
# ─────────────────────────────────────────────────────────
${IMAGE_FILE}    ${EXECDIR}/files/picture.jpg
${VIDEO_FILE}    ${EXECDIR}/files/video.mp4
${AUDIO_FILE}    ${EXECDIR}/files/sound.mp3

# ── Timeouts ──
${TIMEOUT}             15s


*** Keywords ***
Open Browser To Login Page
    Open Browser    ${URL}/login    ${BROWSER}
    Set Selenium Implicit Wait    ${TIMEOUT}
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}

Login As
    [Arguments]    ${email}    ${password}
    Go To    ${URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Clear Element Text    id=identifier
    Input Text    id=identifier    ${email}
    Clear Element Text    id=password
    Input Text    id=password    ${password}
    Click Button    xpath=//button[@type='submit']
    Sleep    2s

Driver Login
    Login As    ${DRIVER_EMAIL}    ${DRIVER_PASS}

Passenger Login
    Login As    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}

Logout
    Delete All Cookies
    Go To    ${URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Sleep    1s

# ── Global Setup/Teardown ──
Prepare Trip For Reporting
    [Documentation]    Setup a new trip, book it, and start it for the passenger to report.
    Driver Login
    Driver Create Route
    Logout
    Passenger Login
    Passenger Book The Route
    Logout
    Driver Login
    Driver Confirm Passenger Booking
    Driver Start Trip And Pickup
    Logout
    Passenger Login
    # Navigate to current trip for reporting
    Wait Until Page Contains Element    xpath=//a[contains(text(),'กำลังเดินทาง...')]    ${TIMEOUT}
    Click Element    xpath=//a[contains(text(),'กำลังเดินทาง...')]
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

# ── Driver: Create Route ──
Driver Create Route
    [Documentation]    Driver navigates to /createTrip and creates a new route
    Go To    ${URL}/createTrip
    Sleep    5s
    Wait Until Page Contains    สร้างการเดินทางของคุณ    ${TIMEOUT}

    # Fill in start point (id=startPoint, placeholder: เช่น กรุงเทพมหานคร, ถนนสุขุมวิท)
    Wait Until Page Contains Element    id=startPoint    ${TIMEOUT}
    Clear Element Text    id=startPoint
    Input Text    id=startPoint    ${START_LOC}
    Sleep    2s
    # Select first Google Maps autocomplete suggestion
    ${has_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    5s
    Run Keyword If    ${has_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill in end point (id=endPoint, placeholder: เช่น เชียงใหม่, ถนนนิมมานเหมินท์)
    Wait Until Page Contains Element    id=endPoint    ${TIMEOUT}
    Clear Element Text    id=endPoint
    Input Text    id=endPoint    ${END_LOC}
    Sleep    2s
    ${has_pac2}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    5s
    Run Keyword If    ${has_pac2}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill travel date (use tomorrow to ensure future date)
    ${tomorrow}=    Evaluate    (datetime.date.today() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')    modules=datetime
    Execute Javascript
    ...    var input = document.getElementById('travelDate');
    ...    var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ...    nativeSetter.call(input, '${tomorrow}');
    ...    input.dispatchEvent(new Event('input', { bubbles: true }));
    ...    input.dispatchEvent(new Event('change', { bubbles: true }));
    Sleep    1s

    # Fill travel time
    Execute Javascript
    ...    var input = document.getElementById('travelTime');
    ...    var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ...    nativeSetter.call(input, '${TRIP_TIME}');
    ...    input.dispatchEvent(new Event('input', { bubbles: true }));
    ...    input.dispatchEvent(new Event('change', { bubbles: true }));
    Sleep    1s

    # Fill seat count
    Wait Until Page Contains Element    id=seatCount    ${TIMEOUT}
    Clear Element Text    id=seatCount
    Input Text    id=seatCount    ${SEATS}
    Sleep    1s

    # Fill price per seat
    Wait Until Page Contains Element    id=pricePerSeat    ${TIMEOUT}
    Clear Element Text    id=pricePerSeat
    Input Text    id=pricePerSeat    ${PRICE}
    Sleep    1s

    # Select vehicle (auto-select first if available)
    ${has_vehicle}=    Run Keyword And Return Status    Page Should Contain Element    id=vehicle
    Run Keyword If    ${has_vehicle}    Select From List By Index    id=vehicle    1

    # Scroll down and click create button
    Execute Javascript    window.scrollTo(0, document.body.scrollHeight);
    Sleep    1s
    Wait Until Page Contains Element    xpath=//button[@type='submit' and contains(text(),'สร้างการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[@type='submit' and contains(text(),'สร้างการเดินทาง')]
    Sleep    3s

# ── Passenger: Book The Route ──
Passenger Book The Route
    [Documentation]    Passenger navigates to /findTrip and books the driver's route
    Go To    ${URL}/findTrip
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
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[1]    ${START_LOC}
    Sleep    2s
    ${pickup_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    3s
    Run Keyword If    ${pickup_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill dropoff point
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[2]    ${END_LOC}
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
    Go To    ${URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Wait for the "คำขอใหม่" section to appear (pending bookings)
    Wait Until Page Contains    คำขอใหม่    ${TIMEOUT}

    # Click "รับ" button to accept the first pending booking
    Wait Until Page Contains Element    xpath=//button[contains(text(),'รับ')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'รับ')]
    Sleep    3s


# ── Driver: Start Trip And Pickup Passenger ──
Driver Start Trip And Pickup
    [Documentation]    Driver starts the trip from /current-trip page and marks passenger as picked up
    Go To    ${URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Click "เริ่มต้นการเดินทาง" button
    ${has_start}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'เริ่มต้นการเดินทาง')]    5s
    Run Keyword If    ${has_start}    Click Element    xpath=//button[contains(text(),'เริ่มต้นการเดินทาง')]
    Sleep    2s

    # Confirm dialog appears — click "ยืนยัน"
    ${has_confirm_start}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน')]    3s
    Run Keyword If    ${has_confirm_start}    Click Element    xpath=//button[contains(text(),'ยืนยัน')]
    Sleep    3s

    # Wait for the "รอรับผู้โดยสาร" section to appear
    Wait Until Page Contains    รอรับผู้โดยสาร    ${TIMEOUT}

    # Click "เช็คอิน" (Check-in / Pickup) for the passenger
    Wait Until Page Contains Element    xpath=//button[@title='เช็คอิน']    ${TIMEOUT}
    Click Element    xpath=//button[@title='เช็คอิน']
    Sleep    3s

# ── Driver: End Trip ──
Driver End Trip
    [Documentation]    Driver navigates to /current-trip and ends the trip
    Go To    ${URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}

    # Click "ส่งตัว" (Drop-off) for the passenger
    Wait Until Page Contains Element    xpath=//button[@title='ส่งตัว']    ${TIMEOUT}
    Click Element    xpath=//button[@title='ส่งตัว']
    Sleep    2s

    # Click "เสร็จสิ้นการเดินทาง" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'เสร็จสิ้นการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'เสร็จสิ้นการเดินทาง')]
    Sleep    2s

    # Confirm dialog appears — click "ยืนยัน"
    ${has_confirm_end}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน')]    3s
    Run Keyword If    ${has_confirm_end}    Click Element    xpath=//button[contains(text(),'ยืนยัน')]
    Sleep    2s

    # Confirm dialog appears — click "ตกลง"
    ${has_confirm_end}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'ตกลง')]    3s
    Run Keyword If    ${has_confirm_end}    Click Element    xpath=//button[contains(text(),'ตกลง')]
    Sleep    2s

# ── Passenger: Report Driver ──
Passenger Report Driver
    [Arguments]    ${scenario_type}
    [Documentation]    Passenger reports the driver during the trip. Types: TEXT, IMAGE, AUDIO, VIDEO
    Go To    ${URL}/current-trip
    Sleep    3s
    Wait Until Page Contains    การเดินทางปัจจุบัน    ${TIMEOUT}
    
    # Click the warning/report icon button
    Wait Until Page Contains Element    xpath=//button[contains(.,'รายงานปัญหา')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(.,'รายงานปัญหา')]
    Sleep    2s

    # Report Modal should appear — title: รายงานปัญหา
    Wait Until Page Contains    รายงานปัญหา    ${TIMEOUT}

    # Select category — SAFETY_ISSUE (ปัญหาด้านความปลอดภัย)
    Wait Until Page Contains Element    xpath=//select    ${TIMEOUT}
    Select From List By Value    xpath=//select    SAFETY_ISSUE
    Sleep    1s

    # Fill in description in the <textarea>
    Wait Until Page Contains Element    xpath=//textarea    ${TIMEOUT}
    Input Text    xpath=//textarea    คนขับขับรถอันตรายมากครับ (${scenario_type})
    Sleep    1s

    # Upload files based on scenario
    Run Keyword If    'IMAGE' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${IMAGE_FILE}
    Sleep    1s
    Run Keyword If    'AUDIO' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${AUDIO_FILE}
    Sleep    1s
    Run Keyword If    'VIDEO' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${VIDEO_FILE}
    Sleep    2s

    # Click "ส่งรายงาน" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ส่งรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ส่งรายงาน')]
    
    # Check for success message (toast notification typically)
    Wait Until Page Contains    ส่งรายงานแล้ว    ${TIMEOUT}
    Sleep    2s

Passenger Report After Trip
    [Arguments]    ${scenario_type}
    [Documentation]    Passenger navigates to /myTrip and reports the completed trip. Types: TEXT, IMAGE, AUDIO, VIDEO
    Go To    ${URL}/myTrip
    Sleep    3s
    Wait Until Page Contains    การเดินทางของฉัน    ${TIMEOUT}

    # Click "รายงาน" button (red button for reporting)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'รายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'รายงาน')]
    Sleep    2s

    # Report Modal should appear — title: รายงานปัญหาการเดินทาง
    Wait Until Page Contains    รายงานปัญหาการเดินทาง    ${TIMEOUT}

    # Select category — SAFETY_ISSUE (ปัญหาด้านความปลอดภัย) using the <select> in the modal
    Wait Until Page Contains Element    xpath=//select    ${TIMEOUT}
    Select From List By Value    xpath=//select    SAFETY_ISSUE
    Sleep    1s

    # Fill in description in the <textarea>
    Wait Until Page Contains Element    xpath=//textarea    ${TIMEOUT}
    Input Text    xpath=//textarea    รายงานย้อนหลัง: คนขับขับรถอันตรายมากครับ (${scenario_type})
    Sleep    1s

    # Upload files based on scenario
    Run Keyword If    'IMAGE' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${IMAGE_FILE}
    Sleep    1s
    Run Keyword If    'AUDIO' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${AUDIO_FILE}
    Sleep    1s
    Run Keyword If    'VIDEO' in '${scenario_type}'    Choose File    xpath=//input[@type='file']    ${VIDEO_FILE}
    Sleep    2s

    # Click "ส่งรายงาน" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ส่งรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ส่งรายงาน')]
    
    # Check for success message (toast notification typically)
    Wait Until Page Contains    ขอบคุณที่แจ้งรายงาน    ${TIMEOUT}
    Sleep    2s


Passenger View Report History
    [Documentation]    Passenger navigates to ${URL_REPORTS} (profile/reports),
    ...                clicks the "ประวัติรายงาน" tab, and verifies report entries with status badge are shown.
    Go To    ${URL_REPORTS}
    Sleep    3s
    Wait Until Page Contains    รายงานและติดตามปัญหา    ${TIMEOUT}

    # Click the "ประวัติรายงาน" tab
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ประวัติรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ประวัติรายงาน')]
    Sleep    2s

    # Page must show history tab content — either a report list or empty message
    ${has_reports}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//span[contains(@class,'rounded-full') and (contains(text(),'รอพิจารณา') or contains(text(),'รับเรื่อง') or contains(text(),'ปฏิเสธ') or contains(text(),'แก้ไขแล้ว'))]    5s
    Run Keyword If    ${has_reports}    Log    พบรายการรายงานพร้อม status badge
    Run Keyword If    not ${has_reports}    Page Should Contain    ยังไม่มีรายงานใดๆ

*** Test Cases ***
Scenario 1: In-Trip Report (TEXT)
    Prepare Trip For Reporting
    Passenger Report Driver    TEXT

Scenario 2: After-Trip Report (TEXT)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    TEXT

Scenario 3: In-Trip Report (IMAGE)
    Prepare Trip For Reporting
    Passenger Report Driver    IMAGE

Scenario 4: After-Trip Report (IMAGE)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    IMAGE

Scenario 5: In-Trip Report (AUDIO)
    Prepare Trip For Reporting
    Passenger Report Driver    AUDIO

Scenario 6: After-Trip Report (AUDIO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    AUDIO

Scenario 7: In-Trip Report (VIDEO)
    Prepare Trip For Reporting
    Passenger Report Driver    VIDEO

Scenario 8: After-Trip Report (VIDEO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    VIDEO

Scenario 9: In-Trip Report (IMAGE_VIDEO)
    Prepare Trip For Reporting
    Passenger Report Driver    IMAGE_VIDEO

Scenario 10: After-Trip Report (IMAGE_VIDEO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    IMAGE_VIDEO

Scenario 11: In-Trip Report (IMAGE_AUDIO)
    Prepare Trip For Reporting
    Passenger Report Driver    IMAGE_AUDIO

Scenario 12: After-Trip Report (IMAGE_AUDIO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    IMAGE_AUDIO

Scenario 13: In-Trip Report (VIDEO_AUDIO)
    Prepare Trip For Reporting
    Passenger Report Driver    VIDEO_AUDIO

Scenario 14: After-Trip Report (VIDEO_AUDIO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    VIDEO_AUDIO

Scenario 15: In-Trip Report (IMAGE_VIDEO_AUDIO)
    Prepare Trip For Reporting
    Passenger Report Driver    IMAGE_VIDEO_AUDIO

Scenario 16: After-Trip Report (IMAGE_VIDEO_AUDIO)
    Driver Login
    Driver End Trip
    Logout
    Passenger Login
    Passenger Report After Trip    IMAGE_VIDEO_AUDIO

Scenario 17: Passenger Views Report History And Verifies Status Badge
    [Documentation]    Passenger navigates to /profile/reports, opens the "ประวัติรายงาน" tab,
    ...                and verifies that at least one report entry is shown with a status badge
    ...                (เช่น "รอพิจารณา" จากการ report ใน Scenario ก่อนหน้า)
    Passenger Login
    Passenger View Report History
    # Reports from previous scenarios already exist — verify PENDING status badge is visible
    Wait Until Page Contains Element    xpath=//span[contains(@class,'bg-yellow-100') and contains(text(),'รอพิจารณา')]    ${TIMEOUT}
    Page Should Contain    รอพิจารณา
    Logout

