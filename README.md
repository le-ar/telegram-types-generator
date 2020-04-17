<h1 align="center">Typescript classes code generator for <a href="https://core.telegram.org/bots/api">Telegram types</a></h1>

<div align="center">

![David](https://img.shields.io/david/le-ar/telegram-types-generator)
![NPM](https://img.shields.io/npm/l/telegram-types-generator)
[![npm](https://img.shields.io/npm/dw/telegram-types-generator)](https://www.npmjs.com/package/telegram-types-generator)
![GitHub top language](https://img.shields.io/github/languages/top/le-ar/telegram-types-generator)
[![CodeFactor](https://www.codefactor.io/repository/github/le-ar/telegram-types-generator/badge)](https://www.codefactor.io/repository/github/le-ar/telegram-types-generator)
[![Bot API](https://img.shields.io/badge/Bot%20API-latest-00aced.svg?&logo=telegram)](https://core.telegram.org/bots/api)

[![patreon](https://img.shields.io/endpoint?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fle_ar%2Fendel)](https://www.patreon.com/le_ar)
[![Liberapay giving](https://img.shields.io/liberapay/receives/le-ar)](https://liberapay.com/le-ar/donate)

</div>

### Default output dirs:
```./etities/``` for Classes

```./serialize/``` for Serialize

## Install

```
    npm install -g telegram-types-generator
```

or

```
    yarn global add telegram-types-generator
```

## Usage

Run ```telegram-types-generator``` in directory where you want to generate classes

Run ```telegram-types-generator --mp``` to generate with methods params

Run ```telegram-types-generator --fd``` to generate with serialize to FormData using [formdata-node](https://www.npmjs.com/package/formdata-node)

## Example Serializer

```typescript
import ChatSerializer from "./serialize/chat_serializer";
import Chat from "./entities/chat";

let json = '{"id":123,"type":"private","username":"username","first_name":"Name"}';

let chat = ChatSerializer.fromJson(JSON.parse(json));

console.log(chat); /* Will print
Chat {
  _id: 123,
  _type: 'private',
  _title: null,
  _username: 'username',
  _firstName: 'Name',
  _lastName: null,
  _photo: null,
  _description: null,
  _inviteLink: null,
  _pinnedMessage: null,
  _permissions: null,
  _slowModeDelay: null,
  _stickerSetName: null,
  _canSetStickerSet: null
}*/

console.log(chat instanceof Chat); // Will print true

let jsonChat = ChatSerializer.toJsonString(chat);
console.log(jsonChat); // Will print {"id":123,"type":"private","username":"username","first_name":"Name"}
```
