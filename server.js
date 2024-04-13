const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require('multer');
const crypto = require('crypto');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
});

const generateFileName = () => crypto.randomBytes(32).toString('hex');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/all', async (req, res) => {
    try {
        const images = await prisma.posts.findMany({ orderBy: [{ created: 'desc' }] });
        if (images) {
            for (const image of images) {
                const params = {
                    Bucket: bucketName,
                    Key: image.imageName,
                };
                const command = new GetObjectCommand(params);
                const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
                image.imageUrl = url;
            }
            res.json(images);
        } else {
            res.status(404).send('No images found');
        }
    } catch (error) {
        console.log('Error fetching images:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/newImage', upload.single('image'), async (req, res) => {
    try {
        if (req.file) {
            const randomFileName = generateFileName();
            const params = {
                Bucket: bucketName,
                Key: randomFileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            };
            const command = new PutObjectCommand(params);
            // sending file to S3
            try {
                await s3.send(command);
            } catch (err) {
                console.log('Error sending to S3');
            }
            // sending file to database
            const image = await prisma.posts.create({
                data: {
                    imageName: randomFileName,
                    caption: req.body.caption
                }
            });
            res.status(201).send(image);
        } else {
            res.status(400).send('The file must be provided');
        }
    } catch (error) {
        console.log('Error fetching images:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/images/:id', async (req, res) => {
    try {
        const id = +req.params.id;
        if (!id) {
            res.status(400).send('Id must be provided');
        }
        const image = await prisma.posts.findUnique({ where: { id } });
        if (!image) {
            res.status(404).send('No such image');
        }
        const params = {
            Bucket: bucketName,
            Key: image.imageName,
        };
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        await prisma.posts.delete({ where: { id } });
        res.send(image);
    } catch (error) {
        console.log('Error fetching images:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});