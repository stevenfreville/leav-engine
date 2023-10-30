FROM node:18-alpine

RUN echo "------------------------ START PREBUILD ---------------------------"

# Dependencies needed to retrieve metadata
RUN apk --update add alpine-sdk perl pkgconfig poppler poppler-dev poppler-utils

WORKDIR /app

COPY . /app

#RUN yarn workspaces focus --all

# Run script/build to build the project in core directory
#RUN yarn workspace core build

# Install apps
CMD ["sh", "/app/scripts/apps_install.sh"]

RUN echo "------------------------ END PREBUILD ---------------------------"
