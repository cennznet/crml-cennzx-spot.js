FROM node:10.13.0
WORKDIR /workdir
ARG GEMFURY_TOKEN

COPY lerna.json package.json yarn.lock tslint.json .prettierignore .prettierrc ./

# set registry
Run npm config set registry https://npm-proxy.fury.io/${GEMFURY_TOKEN}/centrality/
Run npm config set always-auth true

# error on jenkins pipeline - mnpm ERR! 404 Not Found: yarn@latest
RUN yarn config set registry https://registry.npmjs.org
RUN rm yarn.lock

RUN npm install -g yarn
RUN yarn install -q

# install dependecies for packages
COPY ./packages/spotx/package.json ./packages/spotx/
RUN npx lerna bootstrap

COPY CHANGELOG.md ./
COPY . .
# build
RUN npx lerna run build