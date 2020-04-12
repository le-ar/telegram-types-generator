interface ParserHtml {
    parseHtmlToObject(html: string): { [key: string]: any };
}

interface ParserHtmlType {
    parseHtmlToObject(html: string): { name: string, type: string, description: string, optional: boolean };
}

export { ParserHtml, ParserHtmlType };