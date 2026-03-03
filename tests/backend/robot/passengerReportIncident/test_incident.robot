*** Settings ***
Library         SeleniumLibrary
Library         Collections
Library         OperatingSystem

*** Variables ***
${URL}              http://localhost:3001/login
${URL_REPORTS}        http://localhost:3001/profile/reports
${URL_CURRENT_TRIP}   http://localhost:3001/current-trip
${BROWSER}          Chrome

# --- Test Data: Driver ---
${DRIVER_EMAIL}     driver@test.com
${DRIVER_PASS}      password123
${START_LOC}        Bangkok, Thailand
${END_LOC}          Chiang Mai
${TRIP_DATE}        04152026
${TRIP_TIME}        0900AM
${SEATS}            4
${PRICE}            250

# --- Test Data: Admin ---
${ADMIN_USER}       admin123
${ADMIN_PASS}       123456789
${REASON_TEXT}      ตรวจสอบข้อมูลเรียบร้อยแล้ว อนุมัติรายการ

# --- File Paths ---
${IMAGE_FILE}       C:\\SoftEN\\sprint1\\Robot\\flat_tire.jpg
${AUDIO_FILE}       C:\\SoftEN\\sprint1\\Robot\\sound.m4a
${VIDEO_FILE}       C:\\SoftEN\\sprint1\\Robot\\video.mp4

# --- Locators: Shared & Driver ---
${BTN_NAV_CREATE}      xpath=//a[contains(text(), 'สร้างเส้นทาง')]
${BTN_OPEN_REPORT}     xpath=//button[contains(., 'รายงานปัญหา')]
${DRP_ISSUE_TYPE}      xpath=//select[contains(@class, 'w-full')]
${TXT_REPORT_AREA}     xpath=//textarea[@placeholder='อธิบายเหตุการณ์ที่เกิดขึ้น...']
${INP_FILE}            xpath=//input[@type='file']
${BTN_CONFIRM_REPORT}  xpath=//button[contains(text(), 'ส่งรายงาน')]

# --- Locators: Admin Navigation & Action ---
${MENU_SYSTEM}         xpath=//span[contains(@class, 'font-medium') and contains(text(), 'System')]
${SUBMENU_DASHBOARD}   xpath=//a[contains(@href, '/admin/users') and contains(., 'Dashboard')]
${SIDEBAR_REPORT}      xpath=//span[@class='sidebar-text' and contains(text(), 'Report Management')]
${BTN_EDIT_ICON}       xpath=//i[contains(@class, 'fa-pen-to-square')]
${DRP_STATUS_ADMIN}    xpath=//select[contains(@class, 'w-full')]
${TXT_REASON_ADMIN}    xpath=//textarea[@placeholder='ระบุเหตุผลในการตัดสินใจ หรือรายละเอียดการดำเนินการเพิ่มเติม...']
${BTN_SAVE_CHANGES}    xpath=//button[contains(., 'บันทึกการเปลี่ยนแปลง')]
${BTN_BACK}            xpath=//button[.//span[text()='กลับ']]

# --- Locators: Part 3 Driver Journey ---
${MENU_MY_TRIP}        xpath=//a[contains(@href, '/myTrip') and contains(., 'การเดินทางทั้งหมด')]
${SUB_CURRENT_TRIP}    xpath=//a[contains(@href, '/current-trip') and contains(., 'การเดินทางปัจจุบัน')]
${BTN_REPORT_HISTORY}  xpath=//button[contains(., 'ประวัติรายงาน')]
${ITEM_APPROVED}       xpath=//span[contains(@class, 'bg-blue-100') and contains(text(), 'อนุมัติ')]
${BTN_START_TRIP}      xpath=//button[contains(., 'เริ่มต้นการเดินทาง')]
${BTN_CONFIRM_BLUE}    xpath=//button[contains(@class, 'bg-blue-600') and contains(., 'ยืนยัน')]
${BTN_FINISH_TRIP}     xpath=//button[contains(., 'เสร็จสิ้นการเดินทาง')]
${BTN_CONFIRM_GREEN}   xpath=//button[contains(@class, 'bg-green-600') and contains(., 'ยืนยัน')]
${BTN_FINAL_OK}        xpath=//button[contains(@class, 'bg-blue-600') and contains(., 'ตกลง')]

# --- Timeouts ---
${T_MED}            10s
${T_LONG}           30s

*** Test Cases ***
# ==========================================
# PART 1: DRIVER SIDE (REPORTING)
# ==========================================
Scenario 1: Driver Submit Reports
    Open Browser With Options
    Set Selenium Speed    0.7s
    Login Process    ${DRIVER_EMAIL}    ${DRIVER_PASS}
    Create Trip Process
    
    # Test Driver 1: Negative
    Open Report Modal
    Wait Until Element Is Visible    ${BTN_CONFIRM_REPORT}    ${T_MED}
    Click Button    ${BTN_CONFIRM_REPORT}
    Element Should Be Visible    ${BTN_CONFIRM_REPORT}
    
    # Test Driver 2: Text Only
    Select From List By Value    ${DRP_ISSUE_TYPE}    VEHICLE_ISSUE
    Input Text      ${TXT_REPORT_AREA}    ยางรั่ว (Text Only)
    Submit Report And Wait Success    Test Driver 2: OK

    # Test Driver 3-5: Media Case
    Run Media Report Case    ยางรั่ว (Image Only)    ${IMAGE_FILE}    Test Driver 3: OK
    Run Media Report Case    ยางรั่ว (Audio Only)    ${AUDIO_FILE}    Test Driver 4: OK
    Run Media Report Case    ยางรั่ว (Video Only)    ${VIDEO_FILE}    Test Driver 5: OK

    # Test Driver 6: All Media
    Wait Until Keyword Succeeds    3x    2s    Open Report Modal
    Input Text      ${TXT_REPORT_AREA}    ยางรั่ว (All Media Test)
    Choose File     ${INP_FILE}    ${IMAGE_FILE}
    Choose File     ${INP_FILE}    ${AUDIO_FILE}
    Choose File     ${INP_FILE}    ${VIDEO_FILE}
    Wait Until Element Is Enabled    ${BTN_CONFIRM_REPORT}    ${T_LONG}
    Submit Report And Wait Success    Test Driver 6: OK
    [Teardown]    Close Browser

# ==========================================
# PART 2: ADMIN SIDE (APPROVING)
# ==========================================
Scenario 2: Admin Login and Approve All Reports
    Open Browser With Options
    Set Selenium Speed    0.1s
    Login Process    ${ADMIN_USER}    ${ADMIN_PASS}
    Navigate Admin to Reports Page
    Approve All Pending Reports
    Log To Console    Part 2: Admin Cycle Perfect Success!
    [Teardown]    Close Browser

# ==========================================
# PART 3: DRIVER SIDE (VERIFY & JOURNEY)
# ==========================================
Scenario 3: Driver Verify and Full Journey Cycle
    Open Browser With Options
    Set Selenium Speed    0.4s
    Login Process    ${DRIVER_EMAIL}    ${DRIVER_PASS}
    
    # 1. เช็ครายงานในประวัติ
    Go To My Reports and Verify History
    
    # 2. ไปที่การเดินทางปัจจุบัน
    Navigate To Current Trip
    
    # 3. เริ่มต้นและสิ้นสุดการเดินทาง
    Start The Journey
    Finish The Journey And Close
    
    Log To Console    Part 3: Final Cycle Completed Perfectly!
    [Teardown]    Close Browser

*** Keywords ***
# --- Shared ---
Open Browser With Options
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    ${prefs}=    Create Dictionary    profile.password_manager_leak_detection=false    credentials_enable_service=false    profile.password_manager_enabled=false
    Call Method    ${options}    add_experimental_option    prefs    ${prefs}
    Call Method    ${options}    add_argument    --incognito
    Call Method    ${options}    add_argument    --no-sandbox
    Create Webdriver    Chrome    options=${options}
    Go To    ${URL}
    Maximize Browser Window

Login Process
    [Arguments]    ${user}    ${pass}
    Wait Until Element Is Visible    id=identifier    ${T_MED}
    Input Text      id=identifier    ${user}
    Input Text      id=password      ${pass}
    Click Button    xpath=//button[@type='submit']
    Wait Until Location Does Not Contain    /login    ${T_MED}

Safe JS Click
    [Arguments]    ${locator}
    ${element}=    Get WebElement    ${locator}
    Execute Javascript    arguments[0].click();    ARGUMENTS    ${element}

# --- Driver Part 1 Keywords ---
Create Trip Process
    Wait Until Element Is Visible    ${BTN_NAV_CREATE}    ${T_MED}
    Click Element    ${BTN_NAV_CREATE}
    Fill Location    id=startPoint    ${START_LOC}
    Fill Location    id=endPoint      ${END_LOC}
    Input Text      id=travelDate      ${TRIP_DATE}
    Input Text      id=travelTime      ${TRIP_TIME}
    Input Text      id=seatCount       ${SEATS}
    Input Text      id=pricePerSeat    ${PRICE}
    Click Button    xpath=//button[@type='submit' and contains(text(), 'สร้างการเดินทาง')]
    Wait Until Page Contains    สำเร็จ    ${T_MED}

Fill Location
    [Arguments]    ${locator}    ${text}
    Clear Element Text    ${locator}
    Input Text      ${locator}    ${text}
    Sleep    2s
    Press Keys      ${locator}    ARROW_DOWN    TAB

Open Report Modal
    FOR    ${i}    IN RANGE    3
        Sleep    1s
        Wait Until Element Is Visible    ${BTN_OPEN_REPORT}    ${T_MED}
        ${status}=    Run Keyword And Return Status    Click Element    ${BTN_OPEN_REPORT}
        IF    '${status}' == 'False'    Safe JS Click    ${BTN_OPEN_REPORT}
        ${modal}=    Run Keyword And Return Status    Wait Until Element Is Visible    ${TXT_REPORT_AREA}    timeout=5s
        Exit For Loop If    ${modal}
    END
    Wait Until Element Is Visible    ${TXT_REPORT_AREA}    ${T_MED}

Run Media Report Case
    [Arguments]    ${text}    ${file}    ${msg}
    Open Report Modal
    Input Text      ${TXT_REPORT_AREA}    ${text}
    Choose File     ${INP_FILE}    ${file}
    Submit Report And Wait Success    ${msg}

Submit Report And Wait Success
    [Arguments]    ${msg}
    Wait Until Element Is Enabled    ${BTN_CONFIRM_REPORT}    ${T_MED}
    Click Button    ${BTN_CONFIRM_REPORT}
    Wait Until Element Is Not Visible    ${BTN_CONFIRM_REPORT}    ${T_LONG}
    Log To Console    ${msg}

# --- Admin Part 2 Keywords ---
Navigate Admin to Reports Page
    Wait Until Element Is Visible    ${MENU_SYSTEM}    ${T_MED}
    Mouse Over    ${MENU_SYSTEM}
    Sleep    1s
    Safe JS Click    ${SUBMENU_DASHBOARD}
    Wait Until Location Contains    /admin/users    ${T_MED}
    Wait Until Element Is Visible    ${SIDEBAR_REPORT}    ${T_MED}
    Safe JS Click    ${SIDEBAR_REPORT}
    Wait Until Location Contains    /admin/reports    ${T_MED}
    Sleep    2s

Approve All Pending Reports
    ${count}=    Get Element Count    ${BTN_EDIT_ICON}
    FOR    ${index}    IN RANGE    1    ${count} + 1
        ${status_loc}=    Set Variable    xpath=(//tr)[${index}+1]//span[contains(., 'รอพิจารณา')]
        ${is_pending}=    Run Keyword And Return Status    Wait Until Element Is Visible    ${status_loc}    timeout=2s
        IF    ${is_pending}
            ${edit_btn}=    Set Variable    xpath=(//i[contains(@class, 'fa-pen-to-square')]/parent::button)[${index}]
            Safe JS Click    ${edit_btn}
            Process Modal Approval And Return
            Sleep    0.5s
        END
    END

Process Modal Approval And Return
    Wait Until Element Is Visible    ${DRP_STATUS_ADMIN}    ${T_MED}
    Select From List By Value        ${DRP_STATUS_ADMIN}    APPROVED
    Input Text    ${TXT_REASON_ADMIN}    ${REASON_TEXT}
    Safe JS Click    ${BTN_SAVE_CHANGES}
    Sleep    1s
    Wait Until Element Is Visible    ${BTN_BACK}    ${T_MED}
    Safe JS Click    ${BTN_BACK}
    Wait Until Element Is Not Visible    ${BTN_BACK}    ${T_MED}

# --- Driver Part 3 Keywords ---
Go To My Reports and Verify History
    Go To    ${URL_REPORTS}
    Wait Until Element Is Visible    ${BTN_REPORT_HISTORY}    ${T_MED}
    Safe JS Click    ${BTN_REPORT_HISTORY}
    Wait Until Element Is Visible    ${ITEM_APPROVED}    ${T_MED}
    Safe JS Click    ${ITEM_APPROVED}
    Sleep    2s

Navigate To Current Trip
    Wait Until Element Is Visible    ${MENU_MY_TRIP}    ${T_MED}
    Mouse Over    ${MENU_MY_TRIP}
    Sleep    1s
    Wait Until Element Is Visible    ${SUB_CURRENT_TRIP}    ${T_MED}
    Safe JS Click    ${SUB_CURRENT_TRIP}
    Wait Until Location Is    ${URL_CURRENT_TRIP}    ${T_MED}

Start The Journey
    Wait Until Element Is Visible    ${BTN_START_TRIP}    ${T_MED}
    Safe JS Click    ${BTN_START_TRIP}
    Wait Until Element Is Visible    ${BTN_CONFIRM_BLUE}    ${T_MED}
    Safe JS Click    ${BTN_CONFIRM_BLUE}

Finish The Journey And Close
    Wait Until Element Is Visible    ${BTN_FINISH_TRIP}    ${T_MED}
    Safe JS Click    ${BTN_FINISH_TRIP}
    Wait Until Element Is Visible    ${BTN_CONFIRM_GREEN}    ${T_MED}
    Safe JS Click    ${BTN_CONFIRM_GREEN}
    Sleep    1s
    Wait Until Element Is Visible    ${BTN_FINAL_OK}    ${T_MED}
    Safe JS Click    ${BTN_FINAL_OK}
    Sleep    5s