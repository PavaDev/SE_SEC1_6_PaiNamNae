*** Settings ***
Documentation      UI Testing: Create Trip with Specific ID Locators
Library            SeleniumLibrary

*** Variables ***
${URL}             http://localhost:3001/login
${BROWSER}         chrome
${DELAY}           0.1s

# --- ข้อมูล Driver ---
${USER_DRIVER}     YasinDi
${PASS_DRIVER}     123456789

# --- Locators จาก HTML ที่พี่ส่งมา (สร้างเส้นทาง) ---
${INPUT_START}         id=startPoint
${INPUT_END}           id=endPoint
${INPUT_DATE}          id=travelDate
${INPUT_TIME}          id=travelTime
${INPUT_SEATS}         xpath=//input[@type='number' and contains(@placeholder, 'ที่นั่ง')]
${INPUT_PRICE}         xpath=//input[@type='number' and contains(@placeholder, 'ราคา')]
${BTN_SUBMIT_TRIP}     xpath=//button[@type='submit' and contains(text(), 'สร้างการเดินทาง')]

*** Test Cases ***
Driver Create New Trip
    [Setup]    Open Browser Without Security Popups    ${URL}
    Set Selenium Speed    ${DELAY}

    # 1. Login
    Wait Until Element Is Visible    xpath=//input[@placeholder='กรอกชื่อผู้ใช้หรืออีเมล']    timeout=10s
    Input Text       xpath=//input[@placeholder='กรอกชื่อผู้ใช้หรืออีเมล']    ${USER_DRIVER}
    Input Text       xpath=//input[@placeholder='กรอกรหัสผ่าน']    ${PASS_DRIVER}
    Click Element    xpath=//button[contains(text(), 'เข้าสู่ระบบ')]

    # 2. ไปหน้าสร้างเส้นทาง
    Wait Until Element Is Visible    xpath=//a[contains(text(), 'สร้างเส้นทาง')]    timeout=10s
    Click Element                    xpath=//a[contains(text(), 'สร้างเส้นทาง')]

    # 3. กรอกข้อมูลตาม ID ที่พี่ส่งมา
    Wait Until Element Is Visible    ${INPUT_START}    timeout=10s
    Input Text    ${INPUT_START}     Bangkok
    Input Text    ${INPUT_END}       Chiang Mai
    
    # สำหรับ Input Type Date และ Time แนะนำให้ใช้ Press Keys ถ้า Input Text ปกติไม่ทำงาน
    Input Text    ${INPUT_DATE}      11-11-2023    # หรือ 11112023
    Input Text    ${INPUT_TIME}      11:11AM

    # กรอกจำนวนที่นั่งและราคา (ระบุเพิ่มตามความเหมาะสม)
    Input Text    xpath=//input[@name='capacity']    4
    Input Text    xpath=//input[@name='price']       250

    # 4. กดปุ่มสร้างการเดินทาง
    Wait Until Element Is Visible    ${BTN_SUBMIT_TRIP}    timeout=10s
    Click Element                    ${BTN_SUBMIT_TRIP}

    Log    สร้างการเดินทางด้วย ID Locators สำเร็จแล้ว แบบเบิ้มๆ
    [Teardown]    Close Browser

*** Keywords ***
Open Browser Without Security Popups
    [Arguments]    ${target_url}
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys
    
    # ปิด Popup ความปลอดภัยเพื่อไม่ให้ Robot หยุดทำงาน
    Call Method    ${options}    add_argument    --disable-features\=PasswordLeakDetection
    Call Method    ${options}    add_argument    --disable-notifications
    
    ${prefs}=    Create Dictionary    credentials_enable_service=${False}    profile.password_manager_enabled=${False}
    Call Method    ${options}    add_experimental_option    prefs    ${prefs}
    
    Create Webdriver    Chrome    options=${options}
    Go To    ${target_url}
    Maximize Browser Window