FROM public.ecr.aws/lambda/nodejs:14

RUN yum install python -y
RUN yum install make -y
RUN yum install gcc -y
RUN yum install gcc-c++ -y

COPY package.json .
COPY handler.ts .
COPY response-utils.ts .
COPY services ./services

RUN npm install --only=production
RUN npm run build