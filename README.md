# A Little Surprise for Sandhya

## Run locally

```sh
npm install
npm run dev
```

Create the production bundle with `npm run build`; preview it with `npm run preview`.

## Personalise it

Edit `src/config/birthdayConfig.js` to change the four digit playful gate, hint, recipient, signature, messages, and dedication. The password is a client-side experience gate, not security.

Add up to five of your own photos under `public/images/memories/`, then add entries to `config.photos`, for example:

```js
{ src: '/images/memories/photo-1.jpg', caption: 'Your caption', date: '', note: '', alt: 'Describe the photo' }
```

With an empty `photos` array, the gallery is skipped. To enable music, add a properly licensed track at `public/audio/romantic-piano.mp3` or change `config.music.src`. Music is off by default and the rest of the site works without it.

The six story screens, letter text, balloon messages, and birthday details are configured in `src/config/birthdayConfig.js`. The UI uses Framer Motion, Lucide React, and CSS animations; reduced motion preferences are respected.
