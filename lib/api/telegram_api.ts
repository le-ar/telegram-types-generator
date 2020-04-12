import fetch from "node-fetch";

class TelegramApi {
    async getHtml(): Promise<string> {
        let response = await fetch('https://core.telegram.org/bots/api');
        if (response.status !== 200) {
            throw new Error('Can\'t connect to https://core.telegram.org/bots/api');
        }

        let html = await response.text();
        return html;
    }
}

export default TelegramApi;