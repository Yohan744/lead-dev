import { getFlickrPhotos } from './photo_model.js';
import ZipStream from 'zip-stream';
import request from 'request';
import { Storage } from '@google-cloud/storage';

export default class Image {
  constructor() {
    this.storage = new Storage();
    this.zip = null
  }

  async getImage(tags, tagMode) {
    const pictures = await this.fetchImage(tags, tagMode);
    await this.zipImage(pictures);
  }

  async fetchImage(tags, tagMode) {
    return await getFlickrPhotos(tags, tagMode);
  }

  async zipImage(pictures) {
    this.zip = new ZipStream();

    const queue = pictures.map((picture, index) => ({
      name: `image${index + 1}.jpg`,
      url: picture.media.m
    }));

    const addNextFile = async () => {
      console.log('loading next file');
      const elem = queue.shift();
      const stream = request(elem.url);
      this.zip.entry(stream, { name: elem.name }, async err => {
        if (err) throw err;
        if (queue.length > 0) addNextFile();
        else {
          this.zip.finalize();
        }
      });
    }

    addNextFile()
    console.log('test');
  }

  async publishImage() {
    const file = await this.storage
      .bucket('dmii2024bucket')
      .file('public/users/' + 'yohan');
    const stream = file.createWriteStream({
      metadata: {
        // contentType: this.zip.mimetype,
        cacheControl: 'private',
        resumable: false
      }
    });
    return new Promise((resolve, reject) => {
      stream.on('error', err => {
        reject(err);
        console.log(err);
      });
      stream.on('finish', () => {
        resolve('Ok');
      });
      stream.end(this.zip.buffer);
    });
  }
}
