# Sử dụng image Node.js chính thức
FROM node:18

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ project vào container
COPY . .

# Expose port mà app sử dụng
EXPOSE 3000

# Lệnh chạy app khi container khởi động
CMD ["node", "index.js"]