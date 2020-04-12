import ParserHtml from "./parser_html";

class ParserParameterInteger implements ParserHtml {
    parseHtmlToObject(html: string): { [key: string]: any } {
        return {};
    }

}

export default ParserParameterInteger