import ParserHtml from "./parser_html";

class ParserParameterDescription implements ParserHtml {
    parseHtmlToObject(html: string): { [key: string]: any } {
        return {};
    }

}

export default ParserParameterDescription