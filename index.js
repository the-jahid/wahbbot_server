import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import AWS from "aws-sdk";
import dotenv from 'dotenv';
import OpenAI from "openai";
dotenv.config({ path: './.env.local' });

const app = express();



const openai = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
   
})

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

app.use(bodyParser.json());
app.use(cors());

const getResponseFromAi = async (question) => {

   
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: `${question}` },
            
        ],
    });

    return completion.choices[0].message.content;
}

const textToSpeechjs = (language, userText) => {
    return new Promise((resolve, reject) => {
        console.log(language, userText);
        const polly = new AWS.Polly({ region: "ap-south-1" });

        let params = {
            OutputFormat: "mp3",
            Text: userText,
        }

        if (language === 'ar') {
            params.VoiceId = "Zayd";
            params.Engine = "neural";
        } else if (language === 'en-US') {
            params.VoiceId = "Matthew";
        }

        polly.synthesizeSpeech(params, (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                let audioStream = data.AudioStream;
                resolve(audioStream);
            }
        });
    });
}

app.post('/api/text-to-audio-file', async (req, res) => {
    const question = req.body.question;
    const language = req.body.language;

    try {
        const response = await getResponseFromAi(question);
    
        const audioResponse = await textToSpeechjs(language, response);
        
        res.status(200).json({ audioResponse, response });
    } catch (error) {
        console.log('error', error)
        res.status(500).json({ error: 'An error occurred' })
    }
});

app.post('/api/text-to-text', async (req, res) => {
    const question = req.body.question;
   

    try {
        const response = await getResponseFromAi(question);

        console.log('text respone', response)

        res.status(200).json({text:response})
        
    } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
    }
})

const PORT = process.env.PORT || 4001; // Fallback to 4001 if process.env.PORT is not defined
app.listen(PORT, () => {
    console.log(`Server is ready at http://localhost:${PORT}`);
});