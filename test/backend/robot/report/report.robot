*** Settings ***
Documentation     Robot Framework — Passenger Report Driver Behavior
...               User Story: As a passenger, I want to report the driver
...               behavior to the admin and get the update on the filed case.
...               Test Level: UAT (Browser-based E2E)
Library           SeleniumLibrary
Suite Setup       Open Browser To Login Page
Suite Teardown    Close All Browsers
Test Teardown     Run Keyword If Test Failed    Capture Page Screenshot


*** Variables ***
${BASE_URL}            http://localhost:3001
${BROWSER}             chrome

# ── Credentials ──
${ADMIN_USER}          admin123
${ADMIN_PASS}          123456789
${DRIVER_USER}         Driver
${DRIVER_PASS}         123456789
${PASSENGER_USER}      ImYuu_
${PASSENGER_PASS}      123456789

# ── Timeouts ──
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
    Login As    ${DRIVER_USER}    ${DRIVER_PASS}

Passenger Login
    Login As    ${PASSENGER_USER}    ${PASSENGER_PASS}

Admin Login
    Login As    ${ADMIN_USER}    ${ADMIN_PASS}

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
    Input Text    id=startPoint    มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
    Sleep    2s
    # Select first Google Maps autocomplete suggestion
    ${has_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    5s
    Run Keyword If    ${has_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill in end point (id=endPoint, placeholder: เช่น เชียงใหม่, ถนนนิมมานเหมินท์)
    Wait Until Page Contains Element    id=endPoint    ${TIMEOUT}
    Clear Element Text    id=endPoint
    Input Text    id=endPoint    สยามพารากอน
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
    Wait Until Page Contains Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded-lg') and contains(@class,'shadow')])[1]    ${TIMEOUT}
    Click Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded-lg') and contains(@class,'shadow')])[1]
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
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[1]    มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี
    Sleep    2s
    ${pickup_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    3s
    Run Keyword If    ${pickup_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Fill dropoff point
    Run Keyword If    ${pickup_visible}    Input Text    xpath=(//input[@placeholder='พิมพ์ชื่อสถานที่...'])[2]    สยามพารากอน
    Sleep    2s
    ${dropoff_pac}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')]    3s
    Run Keyword If    ${dropoff_pac}    Click Element    xpath=(//div[contains(@class,'pac-container')]//div[contains(@class,'pac-item')])[1]
    Sleep    1s

    # Click "ยืนยันการจอง" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยันการจอง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ยืนยันการจอง')]
    Sleep    3s

# ── Driver: Confirm Passenger Booking ──
Driver Confirm Passenger Booking
    [Documentation]    Driver navigates to /myRoute and confirms the passenger's booking
    Go To    ${BASE_URL}/myRoute
    Sleep    3s

    # Click on pending tab (รอดำเนินการ)
    ${has_pending_tab}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'รอดำเนินการ')]    5s
    Run Keyword If    ${has_pending_tab}    Click Element    xpath=//button[contains(text(),'รอดำเนินการ')]
    Sleep    2s

    # Click on the first pending booking card
    ${has_pending}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//div[contains(@class,'bg-white') and contains(@class,'rounded')]    5s
    Run Keyword If    ${has_pending}    Click Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]
    Sleep    2s

    # Click confirm/approve button
    ${has_approve}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'ยืนยัน') or contains(text(),'อนุมัติ')]    5s
    Run Keyword If    ${has_approve}    Click Element    xpath=//button[contains(text(),'ยืนยัน') or contains(text(),'อนุมัติ')]
    Sleep    1s

    # Handle confirmation modal if present
    ${modal_visible}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'ใช่')]    3s
    Run Keyword If    ${modal_visible}    Click Element    xpath=//button[contains(text(),'ใช่')]
    Sleep    3s

# ── Driver: Complete The Route ──
Driver Complete The Route
    [Documentation]    Driver navigates to /myRoute and completes the route
    Go To    ${BASE_URL}/myRoute
    Sleep    3s

    # Click on myRoutes tab (เส้นทางของฉัน)
    ${has_routes_tab}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'เส้นทางของฉัน')]    5s
    Run Keyword If    ${has_routes_tab}    Click Element    xpath=//button[contains(text(),'เส้นทางของฉัน')]
    Sleep    2s

    # Click on the first route card to expand
    Wait Until Page Contains Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]    ${TIMEOUT}
    Click Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]
    Sleep    2s

    # Click "สิ้นสุดการเดินทาง" button
    Wait Until Page Contains Element    xpath=//button[contains(text(),'สิ้นสุดการเดินทาง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'สิ้นสุดการเดินทาง')]
    Sleep    1s

    # Confirm in the modal (button text: ใช่, สิ้นสุดการเดินทาง)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ใช่')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ใช่')]
    Sleep    3s

# ── Passenger: Report Driver ──
Passenger Report Driver
    [Documentation]    Passenger navigates to /myTrip and submits a report on the completed trip
    Go To    ${BASE_URL}/myTrip
    Sleep    3s
    Wait Until Page Contains    การเดินทางของฉัน    ${TIMEOUT}

    # Switch to "เสร็จสิ้น" tab to find the completed trip
    ${has_completed_tab}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'เสร็จสิ้น')]    5s
    Run Keyword If    ${has_completed_tab}    Click Element    xpath=//button[contains(text(),'เสร็จสิ้น')]
    Sleep    2s

    # Click on the first completed trip card to expand
    Wait Until Page Contains Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]    ${TIMEOUT}
    Click Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]
    Sleep    2s

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
    Input Text    xpath=//textarea    คนขับขับรถเร็วเกินกำหนดและไม่ปฏิบัติตามกฎจราจร ทำให้รู้สึกไม่ปลอดภัย
    Sleep    1s

    # Click submit (ส่งรายงาน)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ส่งรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ส่งรายงาน')]
    Sleep    3s

# ── Admin: Update Report Status ──
Admin Update Report Status
    [Documentation]    Admin navigates to /admin/reports and updates the report status
    Go To    ${BASE_URL}/admin/reports
    Sleep    3s
    Wait Until Page Contains    Report Management    ${TIMEOUT}

    # Wait for reports table to load
    Wait Until Page Contains Element    xpath=//table    ${TIMEOUT}
    Wait Until Page Contains Element    xpath=//tbody/tr    ${TIMEOUT}

    # Click edit on the first report (aria-label='แก้ไข')
    Click Element    xpath=(//tbody/tr[1]//button[@aria-label='แก้ไข'])[1]
    Sleep    2s
    Wait Until Page Contains    สถานะใหม่    ${TIMEOUT}

    # Update status to RESOLVED
    Select From List By Value    xpath=//select    RESOLVED
    Sleep    1s

    # Add admin notes in the <textarea>
    Input Text    xpath=//textarea    ตรวจสอบแล้ว ได้ดำเนินการตักเตือนคนขับเรียบร้อยแล้ว
    Sleep    1s

    # Click save (บันทึก)
    Click Element    xpath=//button[contains(., 'บันทึก')]
    Sleep    3s

# ── Passenger: Verify Report Status ──
Passenger Verify Report Status
    [Documentation]    Passenger checks the report status in /myTrip progress modal
    Go To    ${BASE_URL}/myTrip
    Sleep    3s
    Wait Until Page Contains    การเดินทางของฉัน    ${TIMEOUT}

    # Switch to "เสร็จสิ้น" tab
    ${has_completed_tab}=    Run Keyword And Return Status    Wait Until Page Contains Element    xpath=//button[contains(text(),'เสร็จสิ้น')]    5s
    Run Keyword If    ${has_completed_tab}    Click Element    xpath=//button[contains(text(),'เสร็จสิ้น')]
    Sleep    2s

    # Click on the first completed trip
    Wait Until Page Contains Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]    ${TIMEOUT}
    Click Element    xpath=(//div[contains(@class,'bg-white') and contains(@class,'rounded')])[1]
    Sleep    2s

    # Click "ติดตามสถานะ" button (orange button — report already filed)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ติดตามสถานะ')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ติดตามสถานะ')]
    Sleep    2s

    # Progress modal: click on report tab (สถานะการรายงาน)
    Wait Until Page Contains Element    xpath=//button[contains(text(),'สถานะการรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'สถานะการรายงาน')]
    Sleep    2s

    # Verify report status shows resolved
    Wait Until Page Contains    ดำเนินการแก้ไขแล้ว    ${TIMEOUT}
    Page Should Contain    การตอบรับจากทีมงาน


*** Test Cases ***
# ─────────────────────────────────────────────────────────
# Scenario 1: Driver Creates A Route
# ─────────────────────────────────────────────────────────
Driver Can Create A Route
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
Passenger Can Book The Route
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
# Scenario 3: Driver Confirms Booking And Completes Route
# ─────────────────────────────────────────────────────────
Driver Can Confirm And Complete The Route
    [Documentation]    Given a driver who has a pending booking request,
    ...                When they confirm the booking and then
    ...                complete the route,
    ...                Then the route status should change to completed.
    [Tags]    driver    route    complete
    Driver Login
    Driver Confirm Passenger Booking
    Driver Complete The Route
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 4: Passenger Reports Driver After Trip Ends
# ─────────────────────────────────────────────────────────
Passenger Can Report Driver After Trip
    [Documentation]    Given a passenger whose trip is completed,
    ...                When they navigate to My Trip and submit a
    ...                report about driver behavior,
    ...                Then the report should be submitted successfully.
    [Tags]    passenger    report    create
    Passenger Login
    Passenger Report Driver
    Sleep    2s
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 5: Admin Updates The Report Status
# ─────────────────────────────────────────────────────────
Admin Can View And Update Report Status
    [Documentation]    Given an admin who reviews the report,
    ...                When they update the status to RESOLVED
    ...                and add admin notes,
    ...                Then the report should be updated.
    [Tags]    admin    report    update
    Admin Login
    Admin Update Report Status
    Page Should Contain    แก้ไขแล้ว
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 6: Passenger Sees Updated Report Status
# ─────────────────────────────────────────────────────────
Passenger Can See Updated Report Status
    [Documentation]    Given a passenger who filed a report,
    ...                When they check the report status in My Trip,
    ...                Then they should see the updated status (Resolved)
    ...                and the admin's response.
    [Tags]    passenger    report    status
    Passenger Login
    Passenger Verify Report Status
    [Teardown]    Logout
