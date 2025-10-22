#!/bin/bash
# Build thư viện C++ cho Python

g++ -O3 -std=c++17 -shared -fPIC \
    cpp_ai/Egaroucid_for_Web.cpp \
    cpp_ai/*.hpp \
    -o libegaroucid.so

echo "Build xong libegaroucid.so"