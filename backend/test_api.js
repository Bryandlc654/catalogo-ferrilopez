import dotenv from 'dotenv';
dotenv.config();

(async () => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.PERPLEXITY_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages: [{role: 'user', content: 'hello'}]
        })
    });
    console.log(response.status);
    console.log(await response.json());
})();
