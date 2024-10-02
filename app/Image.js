import { getFlickrPhotos } from './photo_model.js';
import ZipStream from 'zip-stream';
import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';

export default class Image {
  constructor() {
    this.storage = new Storage();
    this.zip = null;
  }

  async getImage(tags, tagMode) {
    const pictures = await this.fetchImage(tags, tagMode);
    await this.zipImage(pictures);
  }

  async fetchImage(tags, tagMode) {
    return await getFlickrPhotos(tags, tagMode);
  }

  async zipImage(pictures) {

    const file = this.storage.bucket('dmii2024bucket').file('yohan.zip');
    const storageStream = file.createWriteStream({
      metadata: {
        contentType: 'application/zip',
        cacheControl: 'private'
      }
    });

    this.zip = new ZipStream();

    this.zip.pipe(storageStream);

    storageStream.on('error', err => {
      console.error('Error uploading to storage:', err);
    });

    storageStream.on('finish', () => {
      this.publishImage();
    });

    for (let i = 0; i < pictures.length; i++) {
      const picture = pictures[i];
      const name = `image${i + 1}.jpg`;
      const url = picture.media.m;

      const arrayBuffer = await (await fetch(url)).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await new Promise((resolve, reject) => {
        this.zip.entry(buffer, { name: name }, err => {
          if (err) {
            console.error('Error adding entry to zip:', err);
            reject(err);
          } else {
            console.log('Added file', name);
            resolve();
          }
        });
      });
    }

    this.zip.finalize();
    console.log('Zipping and uploading file');
  }

  async publishImage() {
    const file = await this.storage.bucket('dmii2024bucket').file('yohan.zip');
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/zip',
        cacheControl: 'private',
        resumable: false
      }
    });
    return new Promise((resolve, reject) => {
      stream.on('error', err => {
        reject(err);
        console.log(err);
      });
      stream.on('finish', async () => {
        resolve('Ok');
        console.log('Zip file has been uploaded.');

        const options = {
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60
        };
        const signedUrls = await this.storage
          .bucket('dmii2024bucket')
          .file('yohan.zip')
          .getSignedUrl(options);
        console.log(' ');
        console.log(`URL: ${signedUrls[0]}`);
        console.log(' ');
      });
      stream.end(this.zip.buffer);
    });
  }
}
