# Bot WhatsApp with Typescript and AI 

### how to setup the system config?

go to `/src/config/system-config.conf` to change the AI behavior

### how to add admin number?

go to `/src/config/config.yaml` edit admin number field, please do not remove any of `@s.whatsapp.net` in this file, that is WhatsApp format

if you have for example 081234567890, just remove the `0` and change it to `62` 6281234567890

### add your api key 

then go to [Google Gemini API](https://aistudio.google.com/apikey) to get your API key and paste in `.env.example`, and rename to just `.env`

then you are ready to GO

### to run the bot is simply like this 

first of all you need to install all dependency in this program

`npm i`

once the npm install is done then you can try to runing as development mode 

`npm run dev` (development mode)

or you can build and then run the program you've build

`npm run build` (to build the bot first)

`npm run start` (to start the program)
