import { ParserHtml, ParserHtmlType } from "./parser_html";

class ParserParameters implements ParserHtml {
    parserParameter: ParserHtmlType;

    constructor(parserParameter: ParserHtmlType) {
        this.parserParameter = parserParameter;
    }

    parseHtmlToObject(html: string): { [key: string]: any } {
        let result = {};

        let startIndexOfBlock = 0;
        while (startIndexOfBlock < html.length) {
            let parsed = this.parseBlock(html, startIndexOfBlock);

            startIndexOfBlock = parsed.endIndex;
            result[parsed.block.name] = parsed.block;
        }

        return result;
    }

    private parseBlock(html: string, startIndex: number): {
        endIndex: number,
        block: {
            name: string;
            type: string;
            description: string;
        }
    } {
        let startIndexOfBlock = html.indexOf('<tr>', startIndex);
        let endIndexOfBlock = html.indexOf('</tr>', startIndexOfBlock);

        let blockHtml = html.slice(startIndexOfBlock + 4, endIndexOfBlock);
        let block = this.parserParameter.parseHtmlToObject(blockHtml.trim());

        return {
            endIndex: endIndexOfBlock + 5,
            block: block
        };
    }
}

export default ParserParameters