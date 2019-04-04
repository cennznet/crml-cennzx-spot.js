FROM node:10.13.0
WORKDIR /workdir
ARG GEMFURY_TOKEN

COPY lerna.json package.json yarn.lock tslint.json .prettierignore .prettierrc ./

RUN npm install -g yarn@1.15.2

# set registry
Run npm config set registry https://npm-proxy.fury.io/${GEMFURY_TOKEN}/centrality/
Run npm config set always-auth true

RUN yarn install -q

# install dependecies for packages
COPY ./packages/spotx/package.json ./packages/spotx/
RUN npx lerna bootstrap

COPY CHANGELOG.md ./
COPY . .
# build
RUN npx lerna run build