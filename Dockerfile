FROM node:18.19.1-bullseye

RUN apt-get update
RUN apt-get install -y build-essential mecab libmecab-dev mecab-ipadic-utf8 sudo git make curl xz-utils file fonts-noto

WORKDIR /mecab-ipadic-neologd
RUN git clone --depth 1 https://github.com/neologd/mecab-ipadic-neologd.git
RUN cd mecab-ipadic-neologd && ./bin/install-mecab-ipadic-neologd -n -y -a

WORKDIR /ai
COPY . ./
RUN yarn install
RUN yarn build

# font.ttfがないとコケるバージョン用 (存在しない文字はfallbackするので別に欧文フォントでいい)
RUN ln -s /usr/share/fonts/truetype/noto/NotoSans-Regular.ttf font.ttf

CMD ["npm", "start"]
