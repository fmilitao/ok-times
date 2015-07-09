
TARGET=../fmilitao.github.io/ok-times/

all:
	tsc main.ts

clean:
	rm *.js

deploy:
	cp main.js $(TARGET)
	cp index.html $(TARGET)
