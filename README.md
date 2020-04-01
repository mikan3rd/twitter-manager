
# Deploy functions
```shell
firebase deploy --only functions
```

# Set up functions configuration
```shell
firebase functions:config:set line.user_id="XXX"
firebase functions:config:get > .runtimeconfig.json
```

# Run the emulator suite
```shell
firebase emulators:start
```
