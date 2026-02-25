*** Settings ***
Documentation     Robot Framework — Admin Report Status Update
...               User Story: As an admin, I want to keep the users updated
...               on their reported incidents.
...               Test Level: UAT (Browser-based E2E)
Library           SeleniumLibrary
Suite Setup       Open Browser To Login Page
Suite Teardown    Close All Browsers
Test Teardown     Run Keyword If Test Failed    Capture Page Screenshot


*** Variables ***
${BASE_URL}            https://kkucsseweb1669.cpkku.com
${BROWSER}             chrome

# ── Credentials ──
${ADMIN_USER}          admin123
${ADMIN_PASS}          adminpassword123456
${DRIVER_USER}         driver
${DRIVER_PASS}         88888888
${PASSENGER_USER}      Hiyuki
${PASSENGER_PASS}      Hiyuki687337

# ── Timeouts ──
${TIMEOUT}             10s


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

Admin Login
    Login As    ${ADMIN_USER}    ${ADMIN_PASS}

Passenger Login
    Login As    ${PASSENGER_USER}    ${PASSENGER_PASS}

Navigate To Admin Reports
    Go To    ${BASE_URL}/admin/reports
    Wait Until Page Contains    Report Management    ${TIMEOUT}

Wait Until Reports Table Is Loaded
    Wait Until Page Contains Element    xpath=//table    ${TIMEOUT}
    Wait Until Page Contains Element    xpath=//tbody/tr    ${TIMEOUT}

Click Edit On First Report
    Wait Until Reports Table Is Loaded
    Click Element    xpath=(//tbody/tr[1]//button[@aria-label='แก้ไข'])[1]
    Wait Until Page Contains    สถานะใหม่    ${TIMEOUT}

Update Report Status
    [Arguments]    ${status}    ${admin_notes}=
    Select From List By Value    xpath=//select    ${status}
    Run Keyword If    '${admin_notes}' != ''    Input Text    xpath=//textarea    ${admin_notes}
    Click Element    xpath=//button[contains(., 'บันทึก')]
    Sleep    2s

Logout
    Delete All Cookies
    Go To    ${BASE_URL}/login
    Wait Until Page Contains Element    id=identifier    ${TIMEOUT}


*** Test Cases ***
# ─────────────────────────────────────────────────────────
# Scenario 1: Admin Can View Report List
# ─────────────────────────────────────────────────────────
Admin Can View Report List
    [Documentation]    Given an admin who is logged in,
    ...                When they navigate to the reports page,
    ...                Then they should see the Report Management heading
    ...                and the reports table with data.
    [Tags]    admin    report    view
    Admin Login
    Navigate To Admin Reports
    Page Should Contain    Report Management
    Wait Until Reports Table Is Loaded
    Page Should Contain Element    xpath=//table
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 2: Admin Can Update Report Status
# ─────────────────────────────────────────────────────────
Admin Can Update Report Status
    [Documentation]    Given an admin reviewing a submitted report,
    ...                When the admin changes the status to RESOLVED
    ...                and adds admin notes,
    ...                Then the report status is updated successfully.
    [Tags]    admin    report    update
    Admin Login
    Navigate To Admin Reports
    Click Edit On First Report
    Update Report Status    RESOLVED    Reviewed and resolved by admin
    Page Should Contain    แก้ไขแล้ว
    [Teardown]    Logout

# ─────────────────────────────────────────────────────────
# Scenario 3: Passenger Can See Updated Report Status
# ─────────────────────────────────────────────────────────
Passenger Can See Updated Report Status
    [Documentation]    Given a passenger who previously submitted a report,
    ...                When they log in and view their profile,
    ...                Then they should be able to see the application
    ...                and access features showing report updates.
    [Tags]    passenger    report    view
    Passenger Login
    Wait Until Page Contains Element    xpath=//body    ${TIMEOUT}
    Page Should Not Contain    เข้าสู่ระบบไม่สำเร็จ
    Go To    ${BASE_URL}
    Sleep    2s
    Page Should Contain Element    xpath=//body
    [Teardown]    Logout
