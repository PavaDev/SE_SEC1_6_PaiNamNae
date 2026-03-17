require('dotenv').config();
console.log('WEB_PUSH_EMAIL:', process.env.WEB_PUSH_EMAIL);
console.log('WEB_PUSH_PUBLIC_KEY:', process.env.WEB_PUSH_PUBLIC_KEY ? 'Present (length: ' + process.env.WEB_PUSH_PUBLIC_KEY.length + ')' : 'MISSING');
console.log('WEB_PUSH_PRIVATE_KEY:', process.env.WEB_PUSH_PRIVATE_KEY ? 'Present' : 'MISSING');
