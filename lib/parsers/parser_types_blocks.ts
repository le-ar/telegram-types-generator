import { ParserHtml } from "./parser_html";

class ParserTypesBlocks implements ParserHtml {
    parserTypesBlock: ParserHtml;

    constructor(parserTypesBlock: ParserHtml) {
        this.parserTypesBlock = parserTypesBlock;
    }

    parseHtmlToObject(html: string, inheritances: { [key: string]: string }): { [key: string]: any } {
        let result = { types: [] };

        let startIndexOfBlock = 0;
        while (startIndexOfBlock < html.length) {
            let parsed = this.parseBlock(html, startIndexOfBlock, inheritances);

            startIndexOfBlock = parsed.endIndex;
            if (
                parsed.block.name.indexOf(' ') === -1 &&
                parsed.block.name[0].toUpperCase() === parsed.block.name[0] &&
                parsed.block.name !== 'InputFile'
            ) {

                result.types.push(parsed.block);
            }
        }
        return result;
    }

    private parseBlock(html: string, startIndex: number, inheritances: { [key: string]: string }): { endIndex: number, block: { [key: string]: any; } } {
        let startIndexOfBlock = html.indexOf('<h4>', startIndex);
        let endIndexOfBlock = html.indexOf('<h4>', startIndexOfBlock + 1);
        if (endIndexOfBlock === -1) {
            endIndexOfBlock = html.length;
        }

        let blockHtml = html.slice(startIndexOfBlock, endIndexOfBlock);
        let block = this.parserTypesBlock.parseHtmlToObject(blockHtml.trim(), inheritances);
        return {
            endIndex: endIndexOfBlock,
            block: block
        };
    }
}

export default ParserTypesBlocks