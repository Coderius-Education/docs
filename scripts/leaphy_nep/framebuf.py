MONO_VLSB, MONO_HLSB, MONO_HMSB, RGB565, GS4_HMSB, GS8 = 0, 3, 4, 1, 2, 6


class FrameBuffer:
    def __init__(self, buf, width, height, fmt, stride=None):
        self.buf, self.width, self.height = buf, width, height

    def fill(self, c):
        pass

    def pixel(self, x, y, c=None):
        return 0 if c is None else None

    def hline(self, *a):
        pass

    def vline(self, *a):
        pass

    def line(self, *a):
        pass

    def rect(self, *a):
        pass

    def fill_rect(self, x, y, w, h, c):
        pass

    def ellipse(self, *a):
        pass

    def poly(self, *a):
        pass

    def scroll(self, *a):
        pass

    def blit(self, *a):
        pass

    def text(self, s, x, y, c=1):
        if not isinstance(s, str):
            raise TypeError(f"can't convert {type(s).__name__} to str")
        for w in (x, y, c):
            if not isinstance(w, int):
                raise TypeError(f"can't convert {type(w).__name__} to int")
