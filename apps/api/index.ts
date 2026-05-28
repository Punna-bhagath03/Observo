import jwt from 'jsonwebtoken';
import 'dotenv/config';
import express from 'express';

const app = express();

import { prismaClient } from 'store/client';
import { AuthInput } from './types';
import { success } from 'zod';
import { authMiddleware } from './middleware';

app.use(express.json());

app.post('/website', authMiddleware, async (req, res) => {
  if (!req.body.url) {
    res.status(411).json({});
    return;
  }

  const website = await prismaClient.website.create({
    data: {
      url: req.body.url,
      timeAdded: new Date(),
      user_id: req.userId!,
    },
  });

  res.json({
    id: website.id,
  });
});

app.get('/status/:websiteId', authMiddleware, (req, res) => {
  const website = prismaClient.website.findFirst({
    where: {
      user_id: req.userId!,
      id: req.params.websiteId,
    },
    include: {
      ticks: {
        orderBy: [
          {
            createdAt: 'desc',
          },
        ],
        take: 1,
      },
    },
  });
  if (!website) {
    res.status(409).json({
      message: 'Not found',
    });
    return;
  }
});

app.post('/user/signup', async (req, res) => {
  const data = AuthInput.safeParse(req.body);
  if (!data.success) {
    console.log(data.error.toString);
    res.status(403).send('');
    return;
  }
  try {
    let user = await prismaClient.user.create({
      data: {
        username: data.data.username,
        password: data.data.password,
      },
    });
    res.json({
      id: user.id,
    });
  } catch (e) {
    console.log(e);
    res.status(403).send('');
  }
});

app.post('/user/signin', async (req, res) => {
  const data = AuthInput.safeParse(req.body);
  if (!data.success) {
    res.status(403).send('');
    return;
  }
  let user = await prismaClient.user.findFirst({
    where: {
      username: data.data.username,
    },
  });
  if (user?.password !== data.data.password) {
    res.status(403).send('');
    return;
  }

  let token = jwt.sign(
    {
      sub: user.id,
    },
    process.env.JWT_SECRET!
  );

  res.json({
    jwt: token,
  });
});
app.listen(process.env.PORT || 3000);
