*** Settings ***
Library         SeleniumLibrary
Library         Collections
Library         OperatingSystem

*** Variables ***
${URL}                  http://localhost:3001/login
${URL_MY_TRIPS}         http://localhost:3001/myTrip
${BROWSER}              Chrome

${PASSENGER_EMAIL}      passenger1@test.com
${PASSENGER_PASS}       password123

${IMAGE_FILE}           C:\\SoftEN\\sprint3\\robot\\flat_tire.jpg
${VIDEO_FILE}           C:\\SoftEN\\sprint3\\robot\\video.mp4

${MENU_MY_TRIP}         xpath=//a[contains(@href, '/myTrip')]

${BTN_GIVE_REVIEW}      xpath=(//button[contains(., 'รีวิว') and not(@disabled) and contains(@class, 'bg-blue-600')])[1]
${BTN_REVIEWED_DISABLED}  xpath=//button[@disabled and contains(., 'รีวิวแล้ว')]

${TXT_REVIEW_COMMENT}   xpath=//textarea[@placeholder='บอกความประทับใจหรือสิ่งที่อยากให้ปรับปรุง...']
${INP_FILE}             xpath=//input[@type='file']
${BTN_SUBMIT_REVIEW}    xpath=//button[contains(., 'ส่งความเห็น')]

${REVIEW_SUCCESS_MSG}   xpath=//*[contains(text(), 'สำเร็จ') or contains(text(), 'Success') or contains(text(), 'ขอบคุณ')]

${T_MED}                10s
${T_LONG}               30s

*** Test Cases ***
UAT-01: Passenger Submit Review With Comment
    [Documentation]    UAT-01
    Open Browser With Options
    Set Selenium Speed    0.5s
    Login Process    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}
    Navigate To My Trips
    Open Review Modal For Completed Trip
    Wait Until Element Is Visible    ${TXT_REVIEW_COMMENT}    ${T_MED}
    Input Text    ${TXT_REVIEW_COMMENT}    คนขับบริการดีมาก รถสะอาด ขับขี่ปลอดภัยแบบเบิ้มๆ เลยฮะ
    Click Submit Review
    Wait Until Element Is Visible    ${REVIEW_SUCCESS_MSG}    ${T_MED}
    Log To Console    UAT-01: PASS
    [Teardown]    Close Browser

UAT-02: Passenger Submit Review With No Comment
    [Documentation]    UAT-02
    Open Browser With Options
    Set Selenium Speed    0.5s
    Login Process    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}
    Navigate To My Trips
    Open Review Modal For Completed Trip
    Wait Until Element Is Visible    ${TXT_REVIEW_COMMENT}    ${T_MED}
    Input Text    ${TXT_REVIEW_COMMENT}    
    Click Submit Review
    Wait Until Element Is Visible    ${REVIEW_SUCCESS_MSG}    ${T_MED}
    Log To Console    UAT-02: PASS
    [Teardown]    Close Browser

UAT-03: Passenger Attempt Re-Review On Already Reviewed Trip
    [Documentation]    UAT-03
    Open Browser With Options
    Set Selenium Speed    0.5s
    Login Process    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}
    Navigate To My Trips
    Wait Until Element Is Visible    ${BTN_REVIEWED_DISABLED}    ${T_MED}
    Element Should Be Disabled    ${BTN_REVIEWED_DISABLED}
    Log To Console    UAT-03: PASS
    [Teardown]    Close Browser

UAT-04: Passenger Submit Review With Image And Comment
    [Documentation]    UAT-04
    Open Browser With Options
    Set Selenium Speed    0.5s
    Login Process    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}
    Navigate To My Trips
    Open Review Modal For Completed Trip
    Wait Until Element Is Visible    ${TXT_REVIEW_COMMENT}    ${T_MED}
    Input Text    ${TXT_REVIEW_COMMENT}    รถสวยตรงปก แอร์เย็นฉ่ำมากฮะ จัดไปแบบเบิ้มๆ
    Choose File    ${INP_FILE}    ${IMAGE_FILE}
    Click Submit Review
    Wait Until Element Is Visible    ${REVIEW_SUCCESS_MSG}    ${T_MED}
    Log To Console    UAT-04: PASS
    [Teardown]    Close Browser

UAT-05: Passenger Submit Review With Multimedia And Feedback
    [Documentation]    UAT-05
    Open Browser With Options
    Set Selenium Speed    0.5s
    Login Process    ${PASSENGER_EMAIL}    ${PASSENGER_PASS}
    Navigate To My Trips
    Open Review Modal For Completed Trip
    Wait Until Element Is Visible    ${TXT_REVIEW_COMMENT}    ${T_MED}
    Input Text    ${TXT_REVIEW_COMMENT}    คนขับสุภาพแต่มาสายหน่อยฮะ มีหลักฐานในวิดีโอนะฮะ
    Choose File    ${INP_FILE}    ${IMAGE_FILE}
    Choose File    ${INP_FILE}    ${VIDEO_FILE}
    Wait Until Element Is Enabled    ${BTN_SUBMIT_REVIEW}    ${T_LONG}
    Click Submit Review
    Wait Until Element Is Visible    ${REVIEW_SUCCESS_MSG}    ${T_MED}
    Log To Console    UAT-05: PASS
    [Teardown]    Close Browser

*** Keywords ***
Open Browser With Options
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    --incognito
    Create Webdriver    Chrome    options=${options}
    Go To    ${URL}
    Maximize Browser Window

Login Process
    [Arguments]    ${user}    ${pass}
    Wait Until Element Is Visible    xpath=//input[contains(@type, 'email') or @id='identifier']    ${T_MED}
    Input Text      xpath=//input[contains(@type, 'email') or @id='identifier']    ${user}
    Input Text      xpath=//input[@type='password']    ${pass}
    Click Button    xpath=//button[@type='submit']
    Wait Until Location Does Not Contain    /login    ${T_MED}

Navigate To My Trips
    Wait Until Element Is Visible    ${MENU_MY_TRIP}    ${T_MED}
    Click Element    ${MENU_MY_TRIP}
    Wait Until Location Contains    /myTrip    ${T_MED}

Open Review Modal For Completed Trip
    Wait Until Element Is Visible    ${BTN_GIVE_REVIEW}    ${T_MED}
    Click Element    ${BTN_GIVE_REVIEW}
    Sleep    1s
    Wait Until Element Is Visible    ${TXT_REVIEW_COMMENT}    ${T_MED}

Click Submit Review
    Wait Until Element Is Enabled    ${BTN_SUBMIT_REVIEW}    ${T_MED}
    Click Button    ${BTN_SUBMIT_REVIEW}