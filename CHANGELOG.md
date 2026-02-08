# koala

## 0.4.8

### Patch Changes

- 9e9ee30: fixed presence
- 8f6e286: fixed crash when no voice channel found

## 0.4.7

### Patch Changes

- f208882: fixed bot crash when tts text too long

## 0.4.6

### Patch Changes

- ec7ce1b: fixed koala sometimes unable to find the channel

## 0.4.5

### Patch Changes

- a7ef04e: fixed koala disconnecting after playing new audio

## 0.4.4

### Patch Changes

- b0cc4b3: removed unnecessary intents

  previously included intents for future use

## 0.4.3

### Patch Changes

- 2c944d6: fixed koala crashing while replying

  occurred due to reply being used instead of editReply

- 2f280e1: fixed koala speaking before switching to the new channel

  happened when voice connection already exists and has to switch to new channel for speech
  would not wait for ready state after initiating change in channel

## 0.4.2

### Patch Changes

- 0d53af4: fixed koala jumping around after changing voice channels

## 0.4.1

### Patch Changes

- 8f9a7bb: update dependencies

## 0.4.0

### Minor Changes

- 432e6c2: storing server member count metric

  - helps in identifying servers abusing the service

- 0e34b7e: added maintenance mode

## 0.3.0

### Minor Changes

- 65358a8: added stats command for bot owners

## 0.2.0

### Minor Changes

- 6921f87: enabled announce by default
- 3c3ad99: added help command
