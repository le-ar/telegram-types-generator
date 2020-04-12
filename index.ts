import TelegramApi from "./lib/api/telegram_api";
import ParserTypesBlocks from "./lib/parsers/parser_types_blocks";
import ParserTypesBlock from "./lib/parsers/parser_types_block";

(async () => {
    let telegramApi = new TelegramApi();
    let parserTypesBlock = new ParserTypesBlock();
    let parserTypesBlocks = new ParserTypesBlocks(parserTypesBlock);
    console.log(parserTypesBlocks.parseHtmlToObject(await new TelegramApi().getHtml()));
})()