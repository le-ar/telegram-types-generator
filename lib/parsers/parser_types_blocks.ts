import ParserHtml from "./parser_html";

class ParserTypesBlocks implements ParserHtml {
    parserTypesBlock: ParserHtml;

    constructor(parserTypesBlock: ParserHtml) {
        this.parserTypesBlock = parserTypesBlock;
    }

    parseHtmlToObject(html: string): { [key: string]: any } {
        let result = { types: [] };

        let startIndexOfBlock = html.indexOf('<h4>');
        while (startIndexOfBlock !== -1) {
            let endIndexOfBlock = html.indexOf('<h4>', startIndexOfBlock + 1);
            if (endIndexOfBlock !== -1) {
                let block = html.slice(startIndexOfBlock, endIndexOfBlock);
                result.types.push(this.parserTypesBlock.parseHtmlToObject(block));
            }
            startIndexOfBlock = endIndexOfBlock;
        }

        return result;
    }
}

export default ParserTypesBlocks