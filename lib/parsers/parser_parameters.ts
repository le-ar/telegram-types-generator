import ParserHtml from "./parser_html";

class ParserParameters implements ParserHtml {
    parseHtmlToObject(html: string): { [key: string]: any } {
        return {};
    }

}

export default ParserParameters