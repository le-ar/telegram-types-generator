Typescript classes code generator for [Telegram types](https://core.telegram.org/bots/api)

[![patreon](https://img.shields.io/endpoint?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fle_ar%2Fendel)](https://www.patreon.com/le_ar)
[![Liberapay giving](https://img.shields.io/liberapay/receives/le-ar)](https://liberapay.com/le-ar/donate)

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
