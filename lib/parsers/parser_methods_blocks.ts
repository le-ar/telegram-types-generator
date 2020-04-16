import { ParserHtml } from "./parser_html";

class ParserMethodsBlocks implements ParserHtml {
    parserTypesBlock: ParserHtml;

    constructor(parserTypesBlock: ParserHtml) {
        this.parserTypesBlock = parserTypesBlock;
    }

    parseHtmlToObject(html: string): { [key: string]: any } {
        let result = { types: [] };

        let startIndexOfBlock = 0;
        while (startIndexOfBlock < html.length) {
            let parsed = this.parseBlock(html, startIndexOfBlock);

            startIndexOfBlock = parsed.endIndex;
            if (
                parsed.block.name.indexOf(' ') === -1 &&
                parsed.block.name[0].toUpperCase() !== parsed.block.name[0] &&
                parsed.block.name !== 'InputFile'
            ) {

                result.types.push(parsed.block);
            }
        }
        return result;
    }

    private parseBlock(html: string, startIndex: number): { endIndex: number, block: { [key: string]: any; } } {
        let startIndexOfBlock = html.indexOf('<h4>', startIndex);
        let endIndexOfBlock = html.indexOf('<h4>', startIndexOfBlock + 1);
        if (endIndexOfBlock === -1) {
            endIndexOfBlock = html.length;
        }

        let blockHtml = html.slice(startIndexOfBlock, endIndexOfBlock);
        let block = this.parserTypesBlock.parseHtmlToObject(blockHtml.trim());
        return {
            endIndex: endIndexOfBlock,
            block: block
        };
    }
}

export default ParserMethodsBlocks