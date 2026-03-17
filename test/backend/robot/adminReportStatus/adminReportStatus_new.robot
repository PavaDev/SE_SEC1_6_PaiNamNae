*** Settings ***
Library           SeleniumLibrary
Library           Collections
Library           OperatingSystem
Suite Setup       Open Browser To Login Page
Suite Teardown    Close All Browsers

*** Variables ***
${URL}                http://localhost:3001
${URL_ADMIN}          http://localhost:3001/admin
${BROWSER}            Chrome

# ─────────────────────────────────────────────────────────
# --- Test Data: Admin ---
# ─────────────────────────────────────────────────────────
${ADMIN_USERNAME}     admin123
${ADMIN_PASSWORD}     123456789

# ─────────────────────────────────────────────────────────
# --- Test Data: Driver ---
# ─────────────────────────────────────────────────────────
${DRIVER_EMAIL}     driver@test.com
${DRIVER_PASS}      password123

# ── Timeouts ──
${TIMEOUT}             15s

*** Keywords ***
Open Browser To Login Page
    Open Browser    ${URL}/login    ${BROWSER}
    Set Selenium Implicit Wait    ${TIMEOUT}
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}

# ── Admin Login ──
Admin Login
    [Documentation]    Admin navigates to /admin and logs in with admin credentials
    Go To    ${URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Clear Element Text    id=identifier
    Input Text    id=identifier    ${ADMIN_USERNAME}
    Clear Element Text    id=password
    Input Text    id=password    ${ADMIN_PASSWORD}
    Click Button    xpath=//button[@type='submit']
    Sleep    3s
    # After login, admin should be redirected to home or admin page
    Go To    ${URL_ADMIN}/reports
    Sleep    3s
    Wait Until Page Contains    Report Management    ${TIMEOUT}

# ── Driver Login ──
Driver Login
    [Documentation]    Driver logs in with their credentials
    Go To    ${URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Clear Element Text    id=identifier
    Input Text    id=identifier    ${DRIVER_EMAIL}
    Clear Element Text    id=password
    Input Text    id=password    ${DRIVER_PASS}
    Click Button    xpath=//button[@type='submit']
    Sleep    2s

Logout
    Delete All Cookies
    Go To    ${URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}
    Sleep    1s

# ── Admin: Navigate to Report Management ──
Admin Navigate To Report Management
    [Documentation]    Admin navigates to /admin/reports (Report Management page)
    Go To    ${URL_ADMIN}/reports
    Sleep    3s
    Wait Until Page Contains    Report Management    ${TIMEOUT}

# ── Admin: Open First Report ──
Admin Open First Report
    [Documentation]    Admin clicks the edit button of the first report in the table
    # Wait for the table to have at least one row
    Wait Until Page Contains Element    xpath=//tbody//tr[1]    ${TIMEOUT}
    # Click the edit (แก้ไข) button in the first row
    Wait Until Page Contains Element    xpath=//tbody//tr[1]//button[@title='แก้ไข']    ${TIMEOUT}
    Click Element    xpath=//tbody//tr[1]//button[@title='แก้ไข']
    Sleep    3s
    # Should navigate to /admin/reports/<id>
    Wait Until Page Contains    รายละเอียดรายงาน    ${TIMEOUT}

# ── Admin: Update Report Status ──
Admin Update Report Status
    [Arguments]    ${new_status}    ${admin_note}
    [Documentation]    Admin selects a new status and saves. new_status can be APPROVED, RESOLVED, or REJECTED.
    # Wait for the status select to appear in the Audit Action Card
    Wait Until Page Contains Element    xpath=//select[option[@value='PENDING']]    ${TIMEOUT}
    Select From List By Value    xpath=//select[option[@value='PENDING']]    ${new_status}
    Sleep    1s

    # Fill in admin notes in the textarea
    Wait Until Page Contains Element    xpath=//textarea[contains(@placeholder,'ระบุเหตุผล')]    ${TIMEOUT}
    Clear Element Text    xpath=//textarea[contains(@placeholder,'ระบุเหตุผล')]
    Input Text    xpath=//textarea[contains(@placeholder,'ระบุเหตุผล')]    ${admin_note}
    Sleep    1s

    # Click "บันทึกการเปลี่ยนแปลง" button
    Wait Until Page Contains Element    xpath=//button[contains(.,'บันทึกการเปลี่ยนแปลง')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(.,'บันทึกการเปลี่ยนแปลง')]
    Sleep    3s

    # Verify success toast or page content shows updated status
    Wait Until Page Contains    บันทึกสำเร็จ    ${TIMEOUT}

# ── Driver: View Report History at /profile/reports ──
Driver View Report History And Verify Status
    [Arguments]    ${expected_status_label}
    [Documentation]    Driver navigates to /profile/reports and verifies the report status has been updated.
    ...    expected_status_label: e.g., 'รับเรื่อง', 'แก้ไขแล้ว', 'ปฏิเสธ'
    Go To    ${URL}/profile/reports
    Sleep    3s
    Wait Until Page Contains    รายงานและติดตามปัญหา    ${TIMEOUT}

    # Click the "ประวัติรายงาน" tab to see report history
    Wait Until Page Contains Element    xpath=//button[contains(text(),'ประวัติรายงาน')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(),'ประวัติรายงาน')]
    Sleep    2s

    # Verify the expected status badge is visible
    Wait Until Page Contains Element
    ...    xpath=//span[contains(@class,'rounded-full') and contains(text(),'${expected_status_label}')]
    ...    ${TIMEOUT}
    Page Should Contain    ${expected_status_label}
    Log    Driver confirmed report status updated to: ${expected_status_label}


*** Test Cases ***
# ─────────────────────────────────────────────────────────────────────────────
# Scenario 1: Admin updates first report to APPROVED
# ─────────────────────────────────────────────────────────────────────────────
Scenario 1: Admin Updates Report Status To APPROVED And Driver Verifies
    [Documentation]
    ...    1. Admin navigates to Report Management (admin/reports)
    ...    2. Admin selects the first report and opens its detail page
    ...    3. Admin changes status to APPROVED (รับเรื่อง) and saves
    ...    4. Driver logs in and visits /profile/reports to verify status is updated to "รับเรื่อง"
    Admin Login
    Admin Navigate To Report Management
    Admin Open First Report
    Admin Update Report Status    APPROVED    รับเรื่องแล้ว กำลังดำเนินการตรวจสอบ
    Logout
    Driver Login
    Driver View Report History And Verify Status    รับเรื่อง
    Logout

# ─────────────────────────────────────────────────────────────────────────────
# Scenario 2: Admin updates first report to RESOLVED
# ─────────────────────────────────────────────────────────────────────────────
Scenario 2: Admin Updates Report Status To RESOLVED And Driver Verifies
    [Documentation]
    ...    1. Admin navigates to Report Management (admin/reports)
    ...    2. Admin selects the first report and opens its detail page
    ...    3. Admin changes status to RESOLVED (แก้ไขแล้ว) and saves
    ...    4. Driver logs in and visits /profile/reports to verify status is updated to "แก้ไขแล้ว"
    Admin Login
    Admin Navigate To Report Management
    Admin Open First Report
    Admin Update Report Status    RESOLVED    ดำเนินการแก้ไขเรียบร้อยแล้ว
    Logout
    Driver Login
    Driver View Report History And Verify Status    แก้ไขแล้ว
    Logout

# ─────────────────────────────────────────────────────────────────────────────
# Scenario 3: Admin updates first report to REJECTED
# ─────────────────────────────────────────────────────────────────────────────
Scenario 3: Admin Updates Report Status To REJECTED And Driver Verifies
    [Documentation]
    ...    1. Admin navigates to Report Management (admin/reports)
    ...    2. Admin selects the first report and opens its detail page
    ...    3. Admin changes status to REJECTED (ปฏิเสธ) and saves
    ...    4. Driver logs in and visits /profile/reports to verify status is updated to "ปฏิเสธ"
    Admin Login
    Admin Navigate To Report Management
    Admin Open First Report
    Admin Update Report Status    REJECTED    ไม่พบหลักฐานเพียงพอในการดำเนินการ
    Logout
    Driver Login
    Driver View Report History And Verify Status    ปฏิเสธ
    Logout

# ─────────────────────────────────────────────────────────────────────────────
# Scenario 4: Admin updates first report to PENDING
# ─────────────────────────────────────────────────────────────────────────────
Scenario 4: Admin Updates Report Status To PENDING And Driver Verifies
    [Documentation]
    ...    1. Admin navigates to Report Management (admin/reports)
    ...    2. Admin selects the first report and opens its detail page
    ...    3. Admin changes status to PENDING (รอพิจารณา) and saves
    ...    4. Driver logs in and visits /profile/reports to verify status is updated to "รอพิจารณา"
    Admin Login
    Admin Navigate To Report Management
    Admin Open First Report
    Admin Update Report Status    PENDING    ไม่พบหลักฐานเพียงพอในการดำเนินการ
    Logout
    Driver Login
    Driver View Report History And Verify Status    รอพิจารณา
    Logout
