import fetch from "node-fetch";

class TelegramApi {
    async getHtml(): Promise<string> {
        let response = await fetch('https://core.telegram.org/bots/api');
        if (response.status !== 200) {
            throw new Error('Can\'t connect to https://core.telegram.org/bots/api');
        }

        let html = await response.text();

        let indexOfStartBlock = html.indexOf('name="available-types"');
        if (indexOfStartBlock === -1) {
            throw new Error('Invalid html');
        }

        let htmlBlock = html.slice(indexOfStartBlock);
        let indexOfEndBlock = htmlBlock.indexOf('<h3>');
        if (indexOfEndBlock !== -1) {
            htmlBlock = htmlBlock.slice(0, indexOfEndBlock);
        }

        return htmlBlock;
    }
}

export default TelegramApi;