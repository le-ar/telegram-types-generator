import { ParserHtmlType } from "./parser_html";

class ParserParameter implements ParserHtmlType {
    parseHtmlToObject(html: string): { name: string, type: string, description: string; optional: boolean; } {
        let splited = [];
        for (let td of html.split('<td>')) {
            splited.push(td.trim());
        }
        return {
            name: splited[1].slice(0, splited[0].length - 5),
            type: splited[2].slice(0, splited[0].length - 5),
            description: splited[3].slice(0, splited[0].length - 5),
            optional: splited[3].slice(0, splited[0].length - 5).startsWith('<em>Optional</em>')
        };
    }

}

export default ParserParameter