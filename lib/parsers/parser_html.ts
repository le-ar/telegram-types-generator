interface ParserHtml {
    parseHtmlToObject(html: string): { [key: string]: any };
}

export default ParserHtml